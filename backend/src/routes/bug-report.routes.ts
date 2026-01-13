import express, { Request, Response } from 'express';
import { querySecure } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { requireAdmin, requireModerator } from '../middleware/role.middleware';
import { uploadBugScreenshots, deleteUploadedFile } from '../middleware/upload.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Submit a bug report
router.post('/submit', authMiddleware, uploadBugScreenshots.array('screenshots', 5), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, lab_type, severity, steps_to_reproduce } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const bugId = uuidv4();
    const screenshots = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/bug-screenshots/${file.filename}`) : [];

    await querySecure(
      `INSERT INTO bug_reports (id, user_id, title, description, lab_type, severity, steps_to_reproduce, screenshots, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')`,
      [bugId, userId, title, description, lab_type || null, severity || 'medium', steps_to_reproduce || null, JSON.stringify(screenshots)]
    );

    res.status(201).json({ 
      message: 'Bug report submitted successfully',
      bugId 
    });
  } catch (error) {
    console.error('Submit bug report error:', error);
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => deleteUploadedFile(file.path));
    }
    res.status(500).json({ error: 'Failed to submit bug report' });
  }
});

// Get user's bug reports
router.get('/my-reports', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await querySecure(
      `SELECT 
        id,
        title,
        description,
        lab_type,
        severity,
        status,
        screenshots,
        admin_notes,
        created_at,
        updated_at
       FROM bug_reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Get user bug reports error:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// Get all bug reports (Admin/Moderator only)
router.get('/all', authMiddleware, requireModerator, async (req: AuthRequest, res: Response) => {
  try {
    const { status, severity, lab_type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        br.id,
        br.title,
        br.description,
        br.lab_type,
        br.severity,
        br.status,
        br.screenshots,
        br.admin_notes,
        br.steps_to_reproduce,
        br.created_at,
        br.updated_at,
        br.resolved_at,
        u.username,
        u.email
      FROM bug_reports br
      JOIN users u ON br.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND br.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (severity) {
      query += ` AND br.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (lab_type) {
      query += ` AND br.lab_type = $${paramIndex}`;
      params.push(lab_type);
      paramIndex++;
    }

    query += ` ORDER BY br.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM bug_reports WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (severity) {
      countQuery += ` AND severity = $${countParamIndex}`;
      countParams.push(severity);
      countParamIndex++;
    }

    if (lab_type) {
      countQuery += ` AND lab_type = $${countParamIndex}`;
      countParams.push(lab_type);
      countParamIndex++;
    }

    const countResult = await querySecure(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({ 
      reports: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all bug reports error:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// Get bug report details (Admin/Moderator or report owner)
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await querySecure(
      `SELECT 
        br.*,
        u.username,
        u.email,
        u.profile_picture
       FROM bug_reports br
       JOIN users u ON br.user_id = u.id
       WHERE br.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    const report = result.rows[0];

    // Check if user is owner or has admin/moderator role
    if (report.user_id !== userId) {
      const roleResult = await querySecure(
        `SELECT role FROM user_roles 
         WHERE user_id = $1 AND role IN ('admin', 'moderator') AND revoked_at IS NULL`,
        [userId]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ report });
  } catch (error) {
    console.error('Get bug report details error:', error);
    res.status(500).json({ error: 'Failed to fetch bug report details' });
  }
});

// Update bug report status (Admin/Moderator only)
router.put('/:id/status', authMiddleware, requireModerator, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const userId = req.user!.userId;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any[] = [status, id];
    let query = 'UPDATE bug_reports SET status = $1, updated_at = CURRENT_TIMESTAMP';

    if (admin_notes) {
      query += ', admin_notes = $3';
      updateData.push(admin_notes);
    }

    if (status === 'resolved' || status === 'closed') {
      query += ', resolved_at = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = $2';

    await querySecure(query, updateData);

    // Log admin activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'update_bug_status', 'bug_report', $2, $3)`,
      [userId, id, JSON.stringify({ status, admin_notes })]
    );

    res.json({ message: 'Bug report status updated successfully' });
  } catch (error) {
    console.error('Update bug report status error:', error);
    res.status(500).json({ error: 'Failed to update bug report status' });
  }
});

// Delete bug report (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get bug report to delete screenshots
    const bugResult = await querySecure(
      'SELECT screenshots FROM bug_reports WHERE id = $1',
      [id]
    );

    if (bugResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    const screenshots = bugResult.rows[0].screenshots;
    if (screenshots && Array.isArray(screenshots)) {
      screenshots.forEach((screenshot: string) => {
        const filePath = path.join(__dirname, '../../', screenshot);
        deleteUploadedFile(filePath);
      });
    }

    await querySecure('DELETE FROM bug_reports WHERE id = $1', [id]);

    // Log admin activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'delete_bug_report', 'bug_report', $2)`,
      [userId, id]
    );

    res.json({ message: 'Bug report deleted successfully' });
  } catch (error) {
    console.error('Delete bug report error:', error);
    res.status(500).json({ error: 'Failed to delete bug report' });
  }
});

// Get bug report statistics (Admin only)
router.get('/stats/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await querySecure(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'open') as open_reports,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_reports,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_reports,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_severity,
        COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_severity,
        COUNT(*) FILTER (WHERE severity = 'low') as low_severity
      FROM bug_reports
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get bug report stats error:', error);
    res.status(500).json({ error: 'Failed to fetch bug report statistics' });
  }
});

import path from 'path';

export default router;
