import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, hashPassword, comparePassword } from '../middleware/auth.middleware';
import { querySecure, getSecureClient } from '../config/database';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `SELECT id, email, username, full_name, email_verified, 
              subscription_plan, subscription_status, subscription_start_date, 
              subscription_end_date, daily_usage_hours, last_usage_reset,
              created_at, last_login
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    // Get usage stats
    const statsResult = await querySecure(
      `SELECT 
         COUNT(*) as total_labs_attempted,
         SUM(CASE WHEN completed THEN 1 ELSE 0 END) as labs_completed,
         SUM(score) as total_score,
         SUM(time_spent_seconds) as total_time_spent
       FROM user_progress
       WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          totalLabsAttempted: parseInt(stats.total_labs_attempted) || 0,
          labsCompleted: parseInt(stats.labs_completed) || 0,
          totalScore: parseInt(stats.total_score) || 0,
          totalTimeSpent: parseInt(stats.total_time_spent) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// Update profile
router.put(
  '/profile',
  authenticateToken,
  [
    body('fullName').optional().trim().isLength({ min: 1, max: 255 }),
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = req.user?.userId;
      const { fullName, username } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (fullName !== undefined) {
        updates.push(`full_name = $${paramCount}`);
        values.push(fullName);
        paramCount++;
      }

      if (username !== undefined) {
        // Check if username is already taken
        const existingUser = await querySecure(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );

        if (existingUser.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Username already taken',
          });
        }

        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await querySecure(query, values);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }
);

// Change password
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
          errors: errors.array(),
        });
      }

      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const result = await querySecure(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await querySecure(
        `UPDATE users 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [newPasswordHash, userId]
      );

      // Invalidate all sessions except current
      await querySecure(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
      });
    }
  }
);

// Change email (requires verification)
router.post(
  '/change-email',
  authenticateToken,
  [body('newEmail').isEmail().normalizeEmail()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address',
          errors: errors.array(),
        });
      }

      const userId = req.user?.userId;
      const { newEmail } = req.body;

      // Check if email is already in use
      const existingUser = await querySecure(
        'SELECT id FROM users WHERE email = $1',
        [newEmail]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use',
        });
      }

      // Generate verification token
      const { generateRandomToken } = require('../middleware/auth.middleware');
      const verificationToken = generateRandomToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Store pending email change
      await querySecure(
        `UPDATE users 
         SET verification_token = $1,
             verification_token_expires = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [verificationToken, verificationExpires, userId]
      );

      // Send verification email to new address
      const emailService = require('../services/email.service').default;
      const user = await querySecure('SELECT username FROM users WHERE id = $1', [userId]);
      
      await emailService.sendEmail({
        to: newEmail,
        subject: 'Verify Your New Email - Pentest Sandbox',
        html: `
          <h2>Email Change Request</h2>
          <p>Hi ${user.rows[0].username},</p>
          <p>Click the link below to verify your new email address:</p>
          <a href="${process.env.CLIENT_URL}/verify-email-change?token=${verificationToken}&email=${newEmail}">
            Verify New Email
          </a>
          <p>This link expires in 24 hours.</p>
        `,
      });

      res.json({
        success: true,
        message: 'Verification email sent to new address',
      });
    } catch (error) {
      console.error('Change email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change email',
      });
    }
  }
);

// Get user progress
router.get('/progress', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `SELECT 
         up.lab_type,
         up.difficulty_level,
         up.completed,
         up.flags_captured,
         up.score,
         up.time_spent_seconds,
         up.attempts,
         up.completed_at,
         lc.name as lab_name,
         lc.description
       FROM user_progress up
       LEFT JOIN lab_configurations lc ON up.lab_type = lc.lab_type
       WHERE up.user_id = $1
       ORDER BY up.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      progress: result.rows,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
    });
  }
});

// Get usage logs
router.get('/usage-logs', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await querySecure(
      `SELECT id, lab_type, action, duration_seconds, metadata, ip_address, created_at
       FROM usage_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      logs: result.rows,
    });
  } catch (error) {
    console.error('Get usage logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage logs',
    });
  }
});

// Check daily usage limit
router.get('/usage-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `SELECT subscription_plan, daily_usage_hours, last_usage_reset
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    const now = new Date();
    const lastReset = new Date(user.last_usage_reset);

    // Reset if more than 24 hours
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      await querySecure(
        `UPDATE users 
         SET daily_usage_hours = 0, last_usage_reset = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );
      user.daily_usage_hours = 0;
    }

    // Get plan limits
    const limits = {
      free: 5,
      starter: 7,
      unlimited: -1,
    };

    const limit = limits[user.subscription_plan as keyof typeof limits] || 5;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - parseFloat(user.daily_usage_hours));

    res.json({
      success: true,
      usage: {
        plan: user.subscription_plan,
        usedHours: parseFloat(user.daily_usage_hours),
        limitHours: limit,
        remainingHours: remaining,
        isUnlimited: limit === -1,
        canStartLab: limit === -1 || remaining > 0,
      },
    });
  } catch (error) {
    console.error('Get usage status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage status',
    });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to delete account',
      });
    }

    // Verify password
    const result = await querySecure(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const isValid = await comparePassword(password, result.rows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Delete user (cascade will delete related records)
    await querySecure('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

export default router;
