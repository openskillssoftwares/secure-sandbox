import express, { Request, Response } from 'express';
import { querySecure } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get global leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await querySecure(
      `SELECT 
        lc.rank,
        lc.user_id,
        lc.username,
        lc.total_score,
        lc.labs_completed,
        u.profile_picture,
        u.created_at as member_since
       FROM leaderboard_cache lc
       JOIN users u ON lc.user_id = u.id
       ORDER BY lc.rank ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await querySecure('SELECT COUNT(*) FROM leaderboard_cache');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      leaderboard: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user's rank and nearby players
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's rank and score
    const userResult = await querySecure(
      `SELECT 
        lc.rank,
        lc.username,
        lc.total_score,
        lc.labs_completed,
        u.profile_picture
       FROM leaderboard_cache lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.user_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        user: {
          rank: null,
          total_score: 0,
          labs_completed: 0
        },
        nearby: []
      });
    }

    const userRank = userResult.rows[0].rank;

    // Get nearby players (5 above and 5 below)
    const nearbyResult = await querySecure(
      `SELECT 
        lc.rank,
        lc.user_id,
        lc.username,
        lc.total_score,
        lc.labs_completed,
        u.profile_picture
       FROM leaderboard_cache lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.rank BETWEEN $1 AND $2
       ORDER BY lc.rank ASC`,
      [Math.max(1, userRank - 5), userRank + 5]
    );

    res.json({
      user: userResult.rows[0],
      nearby: nearbyResult.rows
    });
  } catch (error) {
    console.error('Get user leaderboard position error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard position' });
  }
});

// Get leaderboard by specific lab
router.get('/lab/:labType', async (req: Request, res: Response) => {
  try {
    const { labType } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await querySecure(
      `SELECT 
        RANK() OVER (ORDER BY up.score DESC, up.completed_at ASC) as rank,
        u.id as user_id,
        u.username,
        u.profile_picture,
        up.score,
        up.completed_at,
        up.attempts,
        up.hints_used
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       WHERE up.lab_type = $1 AND up.completed = TRUE
       ORDER BY up.score DESC, up.completed_at ASC
       LIMIT $2 OFFSET $3`,
      [labType, limit, offset]
    );

    // Get total count for this lab
    const countResult = await querySecure(
      'SELECT COUNT(*) FROM user_progress WHERE lab_type = $1 AND completed = TRUE',
      [labType]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      labType,
      leaderboard: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get lab leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch lab leaderboard' });
  }
});

// Get users who solved a specific lab
router.get('/lab/:labType/solvers', async (req: Request, res: Response) => {
  try {
    const { labType } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await querySecure(
      `SELECT 
        u.id,
        u.username,
        u.profile_picture,
        up.score,
        up.completed_at,
        up.attempts
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       WHERE up.lab_type = $1 AND up.completed = TRUE
       ORDER BY up.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [labType, limit, offset]
    );

    const countResult = await querySecure(
      'SELECT COUNT(*) FROM user_progress WHERE lab_type = $1 AND completed = TRUE',
      [labType]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      solvers: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get lab solvers error:', error);
    res.status(500).json({ error: 'Failed to fetch lab solvers' });
  }
});

// Get leaderboard statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await querySecure(`
      SELECT 
        COUNT(*) as total_users,
        AVG(total_score) as average_score,
        MAX(total_score) as highest_score,
        SUM(labs_completed) as total_labs_solved
      FROM leaderboard_cache
    `);

    // Get top lab by completion
    const topLab = await querySecure(`
      SELECT 
        lab_type,
        COUNT(*) as completions
      FROM user_progress
      WHERE completed = TRUE
      GROUP BY lab_type
      ORDER BY completions DESC
      LIMIT 1
    `);

    res.json({
      stats: {
        ...stats.rows[0],
        top_lab: topLab.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard statistics' });
  }
});

// Get top performers of the week
router.get('/top/weekly', async (req: Request, res: Response) => {
  try {
    const result = await querySecure(
      `SELECT 
        u.id,
        u.username,
        u.profile_picture,
        COUNT(up.id) as labs_completed_this_week,
        SUM(up.score) as total_score_this_week
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       WHERE up.completed = TRUE 
         AND up.completed_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY u.id, u.username, u.profile_picture
       ORDER BY total_score_this_week DESC, labs_completed_this_week DESC
       LIMIT 10`
    );

    res.json({ topPerformers: result.rows });
  } catch (error) {
    console.error('Get weekly top performers error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly top performers' });
  }
});

// Get top performers of the month
router.get('/top/monthly', async (req: Request, res: Response) => {
  try {
    const result = await querySecure(
      `SELECT 
        u.id,
        u.username,
        u.profile_picture,
        COUNT(up.id) as labs_completed_this_month,
        SUM(up.score) as total_score_this_month
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       WHERE up.completed = TRUE 
         AND up.completed_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY u.id, u.username, u.profile_picture
       ORDER BY total_score_this_month DESC, labs_completed_this_month DESC
       LIMIT 10`
    );

    res.json({ topPerformers: result.rows });
  } catch (error) {
    console.error('Get monthly top performers error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly top performers' });
  }
});

// Refresh leaderboard cache (Admin only - manual trigger)
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Check admin role
    const roleResult = await querySecure(
      `SELECT role FROM user_roles 
       WHERE user_id = $1 AND role = 'admin' AND revoked_at IS NULL`,
      [userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Refresh leaderboard cache
    await querySecure('TRUNCATE leaderboard_cache');
    await querySecure(`
      INSERT INTO leaderboard_cache (user_id, username, total_score, labs_completed, rank, updated_at)
      SELECT 
        user_id,
        username,
        total_score,
        labs_completed,
        rank,
        CURRENT_TIMESTAMP
      FROM user_rankings
    `);

    res.json({ message: 'Leaderboard cache refreshed successfully' });
  } catch (error) {
    console.error('Refresh leaderboard error:', error);
    res.status(500).json({ error: 'Failed to refresh leaderboard' });
  }
});

export default router;
