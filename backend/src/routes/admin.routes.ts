import express, { Request, Response } from 'express';
import { querySecure, queryVulnerable } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { requireAdmin as requireAdminRole } from '../middleware/role.middleware';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, requireAdminRole);

// Get all users with filters
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, subscription, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.full_name,
        u.profile_picture,
        u.email_verified,
        u.subscription_plan,
        u.subscription_end_date,
        u.oauth_provider,
        u.created_at,
        u.last_login,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed = TRUE) as labs_completed,
        (SELECT SUM(amount) FROM payment_history WHERE user_id = u.id AND status = 'paid') as total_spent,
        (SELECT json_agg(role) FROM user_roles WHERE user_id = u.id AND revoked_at IS NULL) as roles
      FROM users u
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (subscription) {
      query += ` AND u.subscription_plan = $${paramIndex}`;
      params.push(subscription);
      paramIndex++;
    }

    if (role) {
      query += ` AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role = $${paramIndex} AND revoked_at IS NULL)`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (username ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR full_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (subscription) {
      countQuery += ` AND subscription_plan = $${countParamIndex}`;
      countParams.push(subscription);
      countParamIndex++;
    }

    const countResult = await querySecure(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userResult = await querySecure(
      `SELECT 
        u.*,
        up.bio,
        up.location,
        up.website,
        up.github_url,
        up.linkedin_url,
        up.twitter_url,
        up.total_score,
        up.rank,
        up.labs_completed as profile_labs_completed,
        (SELECT json_agg(json_build_object('role', role, 'granted_at', granted_at, 'granted_by', granted_by))
         FROM user_roles WHERE user_id = u.id AND revoked_at IS NULL) as roles
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's lab progress
    const progressResult = await querySecure(
      `SELECT * FROM user_progress WHERE user_id = $1 ORDER BY started_at DESC`,
      [id]
    );

    // Get user's payment history
    const paymentsResult = await querySecure(
      `SELECT * FROM payment_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      user: userResult.rows[0],
      progress: progressResult.rows,
      recentPayments: paymentsResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Grant role to user
router.post('/users/:id/roles', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user!.userId;

    if (!role || !['admin', 'writer', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if role already exists
    const existingRole = await querySecure(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role = $2 AND revoked_at IS NULL',
      [id, role]
    );

    if (existingRole.rows.length > 0) {
      return res.status(400).json({ error: 'User already has this role' });
    }

    await querySecure(
      'INSERT INTO user_roles (user_id, role, granted_by) VALUES ($1, $2, $3)',
      [id, role, adminId]
    );

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'grant_role', 'user', $2, $3)`,
      [adminId, id, JSON.stringify({ role })]
    );

    res.json({ message: `Role '${role}' granted successfully` });
  } catch (error) {
    console.error('Grant role error:', error);
    res.status(500).json({ error: 'Failed to grant role' });
  }
});

// Revoke role from user
router.delete('/users/:id/roles/:role', async (req: AuthRequest, res: Response) => {
  try {
    const { id, role } = req.params;
    const adminId = req.user!.userId;

    await querySecure(
      'UPDATE user_roles SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND role = $2',
      [id, role]
    );

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'revoke_role', 'user', $2, $3)`,
      [adminId, id, JSON.stringify({ role })]
    );

    res.json({ message: `Role '${role}' revoked successfully` });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({ error: 'Failed to revoke role' });
  }
});

// Update user subscription
router.put('/users/:id/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, endDate } = req.body;
    const adminId = req.user!.userId;

    await querySecure(
      'UPDATE users SET subscription_plan = $1, subscription_end_date = $2 WHERE id = $3',
      [plan, endDate, id]
    );

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'update_subscription', 'user', $2, $3)`,
      [adminId, id, JSON.stringify({ plan, endDate })]
    );

    res.json({ message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    // Prevent admin from deleting themselves
    if (id === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await querySecure('DELETE FROM users WHERE id = $1', [id]);

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'delete_user', 'user', $2)`,
      [adminId, id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all lab configurations
router.get('/labs', async (req: AuthRequest, res: Response) => {
  try {
    const result = await queryVulnerable(
      `SELECT * FROM lab_configurations ORDER BY created_at DESC`
    );

    res.json({ labs: result.rows });
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Add new lab
router.post('/labs', async (req: AuthRequest, res: Response) => {
  try {
    const { lab_type, instructions, hints, difficulty, points } = req.body;
    const adminId = req.user!.userId;

    if (!lab_type || !instructions) {
      return res.status(400).json({ error: 'Lab type and instructions are required' });
    }

    await queryVulnerable(
      `INSERT INTO lab_configurations (lab_type, instructions, hints, difficulty, points)
       VALUES ($1, $2, $3, $4, $5)`,
      [lab_type, instructions, hints || [], difficulty || 'medium', points || 100]
    );

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'add_lab', 'lab', $2, $3)`,
      [adminId, lab_type, JSON.stringify({ instructions, difficulty, points })]
    );

    res.status(201).json({ message: 'Lab added successfully' });
  } catch (error) {
    console.error('Add lab error:', error);
    res.status(500).json({ error: 'Failed to add lab' });
  }
});

// Update lab instructions
router.put('/labs/:labType', async (req: AuthRequest, res: Response) => {
  try {
    const { labType } = req.params;
    const { instructions, hints, difficulty, points } = req.body;
    const adminId = req.user!.userId;

    let updateQuery = 'UPDATE lab_configurations SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    let paramIndex = 1;

    if (instructions) {
      updateQuery += `, instructions = $${paramIndex}`;
      params.push(instructions);
      paramIndex++;
    }

    if (hints) {
      updateQuery += `, hints = $${paramIndex}`;
      params.push(hints);
      paramIndex++;
    }

    if (difficulty) {
      updateQuery += `, difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (points !== undefined) {
      updateQuery += `, points = $${paramIndex}`;
      params.push(points);
      paramIndex++;
    }

    updateQuery += ` WHERE lab_type = $${paramIndex}`;
    params.push(labType);

    await queryVulnerable(updateQuery, params);

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'update_lab', 'lab', $2, $3)`,
      [adminId, labType, JSON.stringify({ instructions, hints, difficulty, points })]
    );

    res.json({ message: 'Lab updated successfully' });
  } catch (error) {
    console.error('Update lab error:', error);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

// Delete lab
router.delete('/labs/:labType', async (req: AuthRequest, res: Response) => {
  try {
    const { labType } = req.params;
    const adminId = req.user!.userId;

    await queryVulnerable('DELETE FROM lab_configurations WHERE lab_type = $1', [labType]);

    // Log activity
    await querySecure(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'delete_lab', 'lab', $2)`,
      [adminId, labType]
    );

    res.json({ message: 'Lab deleted successfully' });
  } catch (error) {
    console.error('Delete lab error:', error);
    res.status(500).json({ error: 'Failed to delete lab' });
  }
});

// Get payment history and sales analytics
router.get('/payments/history', async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        ph.*,
        u.username,
        u.email
      FROM payment_history ph
      JOIN users u ON ph.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND ph.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ph.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ph.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY ph.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get dashboard analytics
router.get('/analytics/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    // User stats
    const userStats = await querySecure(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
        COUNT(*) FILTER (WHERE subscription_plan != 'free') as paid_users,
        COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_users_this_week
      FROM users
    `);

    // Revenue stats
    const revenueStats = await querySecure(`
      SELECT 
        SUM(amount) FILTER (WHERE status = 'paid') as total_revenue,
        SUM(amount) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_this_month,
        COUNT(*) FILTER (WHERE status = 'paid') as total_transactions,
        AVG(amount) FILTER (WHERE status = 'paid') as average_transaction_value
      FROM payment_history
    `);

    // Lab stats
    const labStats = await querySecure(`
      SELECT 
        COUNT(DISTINCT user_id) as total_lab_participants,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as total_completions,
        AVG(score) FILTER (WHERE completed = TRUE) as average_score
      FROM user_progress
    `);

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = await querySecure(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM payment_history
      WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    res.json({
      userStats: userStats.rows[0],
      revenueStats: revenueStats.rows[0],
      labStats: labStats.rows[0],
      monthlyRevenue: monthlyRevenue.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export user report as PDF
router.get('/reports/users/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const users = await querySecure(`
      SELECT 
        u.username,
        u.email,
        u.subscription_plan,
        u.created_at,
        COUNT(up.id) FILTER (WHERE up.completed = TRUE) as labs_completed,
        SUM(ph.amount) FILTER (WHERE ph.status = 'paid') as total_spent
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN payment_history ph ON u.id = ph.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 100
    `);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=users-report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('User Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text(`Total Users: ${users.rows.length}`, { underline: true });
    doc.moveDown();

    users.rows.forEach((user, index) => {
      doc.fontSize(10)
        .text(`${index + 1}. ${user.username} (${user.email})`)
        .text(`   Plan: ${user.subscription_plan} | Labs: ${user.labs_completed} | Spent: $${user.total_spent || 0}`)
        .moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Export user report as Excel
router.get('/reports/users/excel', async (req: AuthRequest, res: Response) => {
  try {
    const users = await querySecure(`
      SELECT 
        u.username,
        u.email,
        u.full_name,
        u.subscription_plan,
        u.created_at,
        u.last_login,
        COUNT(up.id) FILTER (WHERE up.completed = TRUE) as labs_completed,
        SUM(ph.amount) FILTER (WHERE ph.status = 'paid') as total_spent
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN payment_history ph ON u.id = ph.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Plan', key: 'subscription_plan', width: 15 },
      { header: 'Labs Completed', key: 'labs_completed', width: 15 },
      { header: 'Total Spent', key: 'total_spent', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Last Login', key: 'last_login', width: 20 },
    ];

    users.rows.forEach(user => {
      worksheet.addRow({
        ...user,
        total_spent: user.total_spent || 0,
        created_at: new Date(user.created_at).toLocaleDateString(),
        last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// Get admin activity logs
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await querySecure(
      `SELECT 
        al.*,
        u.username as admin_username
       FROM admin_activity_logs al
       JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

export default router;
