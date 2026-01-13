import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { querySecure } from '../config/database';

const router = Router();

// Get all available labs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all active labs
    const labsResult = await querySecure(
      `SELECT 
         id, lab_type, name, description, difficulty_levels, 
         estimated_time_minutes, prerequisites, tags, is_active
       FROM lab_configurations
       WHERE is_active = true
       ORDER BY name`,
      []
    );

    // Get user progress for these labs
    const progressResult = await querySecure(
      `SELECT lab_type, difficulty_level, completed, score, attempts
       FROM user_progress
       WHERE user_id = $1`,
      [userId]
    );

    // Map progress to labs
    const progressMap = new Map();
    progressResult.rows.forEach((progress: any) => {
      const key = `${progress.lab_type}-${progress.difficulty_level}`;
      progressMap.set(key, progress);
    });

    const labs = labsResult.rows.map((lab: any) => {
      const difficultyProgress: any = {};
      
      lab.difficulty_levels.forEach((level: string) => {
        const key = `${lab.lab_type}-${level}`;
        const progress = progressMap.get(key);
        
        difficultyProgress[level] = {
          completed: progress?.completed || false,
          score: progress?.score || 0,
          attempts: progress?.attempts || 0,
        };
      });

      return {
        ...lab,
        progress: difficultyProgress,
      };
    });

    res.json({
      success: true,
      labs,
    });
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labs',
    });
  }
});

// Get specific lab details
router.get('/:labType', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { labType } = req.params;

    const result = await querySecure(
      `SELECT * FROM lab_configurations WHERE lab_type = $1 AND is_active = true`,
      [labType]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found',
      });
    }

    const lab = result.rows[0];

    // Get user progress
    const progressResult = await querySecure(
      `SELECT difficulty_level, completed, score, time_spent_seconds, attempts, completed_at
       FROM user_progress
       WHERE user_id = $1 AND lab_type = $2`,
      [userId, labType]
    );

    const progressMap = new Map();
    progressResult.rows.forEach((progress: any) => {
      progressMap.set(progress.difficulty_level, progress);
    });

    res.json({
      success: true,
      lab: {
        ...lab,
        flags: undefined, // Don't expose flags to client
        userProgress: progressResult.rows,
      },
    });
  } catch (error) {
    console.error('Get lab details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab details',
    });
  }
});

// Get lab categories/tags
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const result = await querySecure(
      `SELECT DISTINCT unnest(tags) as tag
       FROM lab_configurations
       WHERE is_active = true
       ORDER BY tag`,
      []
    );

    const categories = result.rows.map((row: any) => row.tag);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
});

// Get leaderboard
router.get('/leaderboard/global', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await querySecure(
      `SELECT 
         u.username,
         SUM(up.score) as total_score,
         COUNT(CASE WHEN up.completed THEN 1 END) as labs_completed,
         SUM(up.time_spent_seconds) as total_time_spent
       FROM users u
       INNER JOIN user_progress up ON u.id = up.user_id
       WHERE up.completed = true
       GROUP BY u.id, u.username
       ORDER BY total_score DESC, labs_completed DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      leaderboard: result.rows.map((row: any, index: number) => ({
        rank: index + 1,
        username: row.username,
        totalScore: parseInt(row.total_score),
        labsCompleted: parseInt(row.labs_completed),
        totalTimeSpent: parseInt(row.total_time_spent),
      })),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
    });
  }
});

// Get user rank
router.get('/leaderboard/rank', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `WITH ranked_users AS (
         SELECT 
           u.id,
           u.username,
           SUM(up.score) as total_score,
           COUNT(CASE WHEN up.completed THEN 1 END) as labs_completed,
           RANK() OVER (ORDER BY SUM(up.score) DESC, COUNT(CASE WHEN up.completed THEN 1 END) DESC) as rank
         FROM users u
         LEFT JOIN user_progress up ON u.id = up.user_id
         GROUP BY u.id, u.username
       )
       SELECT * FROM ranked_users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        rank: null,
        totalScore: 0,
        labsCompleted: 0,
      });
    }

    res.json({
      success: true,
      ...result.rows[0],
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
    });
  }
});

// Get lab statistics
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await querySecure(
      `SELECT 
         COUNT(*) as total_labs,
         SUM(CASE WHEN 'easy' = ANY(difficulty_levels) THEN 1 ELSE 0 END) as easy_labs,
         SUM(CASE WHEN 'medium' = ANY(difficulty_levels) THEN 1 ELSE 0 END) as medium_labs,
         SUM(CASE WHEN 'hard' = ANY(difficulty_levels) THEN 1 ELSE 0 END) as hard_labs,
         SUM(CASE WHEN 'impossible' = ANY(difficulty_levels) THEN 1 ELSE 0 END) as impossible_labs
       FROM lab_configurations
       WHERE is_active = true`,
      []
    );

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    console.error('Get lab stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab statistics',
    });
  }
});

export default router;
