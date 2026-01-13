import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, requireEmailVerification } from '../middleware/auth.middleware';
import { querySecure, getSecureClient } from '../config/database';
import sandboxService from '../services/sandbox.service';

const router = Router();

// Check usage limit middleware
async function checkUsageLimit(req: AuthRequest, res: Response, next: any) {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      'SELECT subscription_plan, daily_usage_hours, last_usage_reset FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    const now = new Date();
    const lastReset = new Date(user.last_usage_reset);

    // Reset if more than 24 hours
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      await querySecure(
        'UPDATE users SET daily_usage_hours = 0, last_usage_reset = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      user.daily_usage_hours = 0;
    }

    const limits = { free: 5, starter: 7, unlimited: -1 };
    const limit = limits[user.subscription_plan as keyof typeof limits] || 5;

    if (limit !== -1 && parseFloat(user.daily_usage_hours) >= limit) {
      return res.status(403).json({
        success: false,
        message: 'Daily usage limit reached. Please upgrade your plan for more access.',
        usedHours: parseFloat(user.daily_usage_hours),
        limitHours: limit,
      });
    }

    next();
  } catch (error) {
    console.error('Usage limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check usage limit',
    });
  }
}

// Start a new sandbox instance
router.post(
  '/start',
  authenticateToken,
  requireEmailVerification,
  checkUsageLimit,
  [
    body('labType').notEmpty(),
    body('difficultyLevel').isIn(['easy', 'medium', 'hard', 'impossible']),
  ],
  async (req: AuthRequest, res: Response) => {
    const client = await getSecureClient();
    
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = req.user?.userId;
      const { labType, difficultyLevel } = req.body;

      // Check if user already has a running sandbox for this lab
      const existingSandbox = await client.query(
        'SELECT id, container_id FROM sandbox_instances WHERE user_id = $1 AND lab_type = $2 AND status = $3',
        [userId, labType, 'running']
      );

      if (existingSandbox.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'You already have a running sandbox for this lab. Please stop it first.',
          sandboxId: existingSandbox.rows[0].id,
        });
      }

      // Get lab configuration
      const labConfig = await client.query(
        'SELECT docker_image, name, flags FROM lab_configurations WHERE lab_type = $1 AND is_active = true',
        [labType]
      );

      if (labConfig.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Lab not found or inactive',
        });
      }

      const lab = labConfig.rows[0];

      // Create sandbox
      const sandbox = await sandboxService.createSandbox({
        userId: userId!,
        labType,
        difficultyLevel,
        dockerImage: lab.docker_image,
      });

      // Set auto-stop time (12 hours from now)
      const autoStopTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

      // Save sandbox instance to database
      const result = await client.query(
        `INSERT INTO sandbox_instances 
         (user_id, container_id, lab_type, difficulty_level, port, status, auto_stop_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, sandbox.containerId, labType, difficultyLevel, sandbox.port, 'running', autoStopTime]
      );

      // Initialize user progress if not exists
      await client.query(
        `INSERT INTO user_progress (user_id, lab_type, difficulty_level, attempts)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, lab_type, difficulty_level) 
         DO UPDATE SET attempts = user_progress.attempts + 1, updated_at = CURRENT_TIMESTAMP`,
        [userId, labType, difficultyLevel]
      );

      // Log the action
      await client.query(
        'INSERT INTO usage_logs (user_id, lab_type, action, metadata) VALUES ($1, $2, $3, $4)',
        [userId, labType, 'lab_start', JSON.stringify({ difficultyLevel, port: sandbox.port })]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Sandbox started successfully',
        sandbox: {
          id: result.rows[0].id,
          containerId: sandbox.containerId,
          labType,
          labName: lab.name,
          difficultyLevel,
          port: sandbox.port,
          url: `http://localhost:${sandbox.port}`,
          autoStopTime,
          status: 'running',
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Start sandbox error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start sandbox',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      client.release();
    }
  }
);

// Stop sandbox
router.post('/stop/:sandboxId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const client = await getSecureClient();
  
  try {
    await client.query('BEGIN');

    const userId = req.user?.userId;
    const { sandboxId } = req.params;

    // Get sandbox
    const result = await client.query(
      'SELECT * FROM sandbox_instances WHERE id = $1 AND user_id = $2',
      [sandboxId, userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found',
      });
    }

    const sandbox = result.rows[0];

    // Destroy sandbox
    await sandboxService.destroySandbox(sandbox.container_id);

    // Calculate session duration
    const startTime = new Date(sandbox.start_time);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const durationHours = durationSeconds / 3600;

    // Update sandbox status
    await client.query(
      'UPDATE sandbox_instances SET status = $1, last_accessed = CURRENT_TIMESTAMP WHERE id = $2',
      ['stopped', sandboxId]
    );

    // Update user usage
    await client.query(
      'UPDATE users SET daily_usage_hours = daily_usage_hours + $1 WHERE id = $2',
      [durationHours, userId]
    );

    // Update user progress time
    await client.query(
      `UPDATE user_progress 
       SET time_spent_seconds = time_spent_seconds + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND lab_type = $3 AND difficulty_level = $4`,
      [durationSeconds, userId, sandbox.lab_type, sandbox.difficulty_level]
    );

    // Log the action
    await client.query(
      'INSERT INTO usage_logs (user_id, lab_type, action, duration_seconds) VALUES ($1, $2, $3, $4)',
      [userId, sandbox.lab_type, 'lab_stop', durationSeconds]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sandbox stopped successfully',
      duration: {
        seconds: durationSeconds,
        hours: durationHours.toFixed(2),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Stop sandbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop sandbox',
    });
  } finally {
    client.release();
  }
});

// Get user's active sandboxes
router.get('/active', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `SELECT 
         si.*,
         lc.name as lab_name,
         lc.description
       FROM sandbox_instances si
       LEFT JOIN lab_configurations lc ON si.lab_type = lc.lab_type
       WHERE si.user_id = $1 AND si.status = $2
       ORDER BY si.start_time DESC`,
      [userId, 'running']
    );

    res.json({
      success: true,
      sandboxes: result.rows,
    });
  } catch (error) {
    console.error('Get active sandboxes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sandboxes',
    });
  }
});

// Get sandbox details
router.get('/:sandboxId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sandboxId } = req.params;

    const result = await querySecure(
      `SELECT 
         si.*,
         lc.name as lab_name,
         lc.description,
         lc.hints
       FROM sandbox_instances si
       LEFT JOIN lab_configurations lc ON si.lab_type = lc.lab_type
       WHERE si.id = $1 AND si.user_id = $2`,
      [sandboxId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found',
      });
    }

    const sandbox = result.rows[0];

    // Get container status
    if (sandbox.status === 'running') {
      const status = await sandboxService.getSandboxStatus(sandbox.container_id);
      if (status !== 'running') {
        await querySecure(
          'UPDATE sandbox_instances SET status = $1 WHERE id = $2',
          [status, sandboxId]
        );
        sandbox.status = status;
      }
    }

    res.json({
      success: true,
      sandbox,
    });
  } catch (error) {
    console.error('Get sandbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sandbox details',
    });
  }
});

// Restart sandbox
router.post('/restart/:sandboxId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sandboxId } = req.params;

    const result = await querySecure(
      'SELECT container_id FROM sandbox_instances WHERE id = $1 AND user_id = $2 AND status = $3',
      [sandboxId, userId, 'running']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found or not running',
      });
    }

    await sandboxService.restartSandbox(result.rows[0].container_id);

    res.json({
      success: true,
      message: 'Sandbox restarted successfully',
    });
  } catch (error) {
    console.error('Restart sandbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart sandbox',
    });
  }
});

// Submit flag
router.post(
  '/submit-flag/:sandboxId',
  authenticateToken,
  [body('flag').notEmpty()],
  async (req: AuthRequest, res: Response) => {
    const client = await getSecureClient();
    
    try {
      await client.query('BEGIN');

      const userId = req.user?.userId;
      const { sandboxId } = req.params;
      const { flag } = req.body;

      // Get sandbox and lab info
      const result = await client.query(
        `SELECT si.*, lc.flags, lc.points_per_level
         FROM sandbox_instances si
         LEFT JOIN lab_configurations lc ON si.lab_type = lc.lab_type
         WHERE si.id = $1 AND si.user_id = $2`,
        [sandboxId, userId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Sandbox not found',
        });
      }

      const sandbox = result.rows[0];
      const correctFlag = sandbox.flags[sandbox.difficulty_level];
      const points = sandbox.points_per_level[sandbox.difficulty_level];

      if (flag === correctFlag) {
        // Update user progress
        await client.query(
          `UPDATE user_progress
           SET completed = true,
               flags_captured = array_append(flags_captured, $1::jsonb),
               score = score + $2,
               completed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $3 AND lab_type = $4 AND difficulty_level = $5`,
          [JSON.stringify({ flag, timestamp: new Date() }), points, userId, sandbox.lab_type, sandbox.difficulty_level]
        );

        // Log success
        await client.query(
          'INSERT INTO usage_logs (user_id, lab_type, action, metadata) VALUES ($1, $2, $3, $4)',
          [userId, sandbox.lab_type, 'flag_captured', JSON.stringify({ difficultyLevel: sandbox.difficulty_level, points })]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Congratulations! Flag captured successfully! 🎉',
          points,
          correct: true,
        });
      } else {
        await client.query('ROLLBACK');
        res.json({
          success: false,
          message: 'Incorrect flag. Keep trying!',
          correct: false,
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Submit flag error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit flag',
      });
    } finally {
      client.release();
    }
  }
);

export default router;
