import express, { Request, Response } from 'express';
import { querySecure } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { requireWriter, requireAdmin } from '../middleware/role.middleware';
import { uploadBlogImage, deleteUploadedFile } from '../middleware/upload.middleware';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Get all published blogs (Public)
router.get('/published', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        b.id,
        b.title,
        b.slug,
        b.excerpt,
        b.featured_image,
        b.tags,
        b.views,
        b.published_at,
        u.username as author,
        u.profile_picture as author_picture
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (b.title ILIKE $${paramIndex} OR b.excerpt ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tag) {
      query += ` AND $${paramIndex} = ANY(b.tags)`;
      params.push(tag);
      paramIndex++;
    }

    query += ` ORDER BY b.published_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM blogs WHERE status = \'published\'';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR excerpt ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (tag) {
      countQuery += ` AND $${countParamIndex} = ANY(tags)`;
      countParams.push(tag);
      countParamIndex++;
    }

    const countResult = await querySecure(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      blogs: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get published blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Get single blog by slug (Public)
router.get('/published/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await querySecure(
      `SELECT 
        b.*,
        u.username as author,
        u.full_name as author_name,
        u.profile_picture as author_picture
       FROM blogs b
       JOIN users u ON b.author_id = u.id
       WHERE b.slug = $1 AND b.status = 'published'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment view count
    await querySecure(
      'UPDATE blogs SET views = views + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({ blog: result.rows[0] });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Get user's blogs (Writer)
router.get('/my-blogs', authMiddleware, requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        id,
        title,
        slug,
        excerpt,
        featured_image,
        tags,
        status,
        views,
        published_at,
        created_at,
        updated_at
      FROM blogs
      WHERE author_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    res.json({ blogs: result.rows });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Create new blog (Writer)
router.post('/', authMiddleware, requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, content, excerpt, tags, status = 'draft' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blogId = uuidv4();
    let slug = generateSlug(title);

    // Ensure unique slug
    const existingSlug = await querySecure('SELECT id FROM blogs WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const publishedAt = status === 'published' ? new Date() : null;

    await querySecure(
      `INSERT INTO blogs (id, author_id, title, slug, content, excerpt, tags, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [blogId, userId, title, slug, content, excerpt || null, tags || [], status, publishedAt]
    );

    res.status(201).json({
      message: 'Blog created successfully',
      blogId,
      slug
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update blog (Writer - own blogs only)
router.put('/:id', authMiddleware, requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, content, excerpt, tags, status } = req.body;

    // Check if user owns this blog
    const blogResult = await querySecure(
      'SELECT author_id, slug FROM blogs WHERE id = $1',
      [id]
    );

    if (blogResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blogResult.rows[0].author_id !== userId) {
      // Check if user is admin
      const roleResult = await querySecure(
        `SELECT role FROM user_roles 
         WHERE user_id = $1 AND role = 'admin' AND revoked_at IS NULL`,
        [userId]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let updateQuery = 'UPDATE blogs SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    let paramIndex = 1;

    if (title) {
      updateQuery += `, title = $${paramIndex}`;
      params.push(title);
      paramIndex++;

      // Update slug if title changed
      const newSlug = generateSlug(title);
      updateQuery += `, slug = $${paramIndex}`;
      params.push(newSlug);
      paramIndex++;
    }

    if (content) {
      updateQuery += `, content = $${paramIndex}`;
      params.push(content);
      paramIndex++;
    }

    if (excerpt !== undefined) {
      updateQuery += `, excerpt = $${paramIndex}`;
      params.push(excerpt);
      paramIndex++;
    }

    if (tags) {
      updateQuery += `, tags = $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    if (status) {
      updateQuery += `, status = $${paramIndex}`;
      params.push(status);
      paramIndex++;

      // Set published_at if status changed to published
      if (status === 'published') {
        updateQuery += `, published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`;
      }
    }

    updateQuery += ` WHERE id = $${paramIndex}`;
    params.push(id);

    await querySecure(updateQuery, params);

    res.json({ message: 'Blog updated successfully' });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Upload featured image for blog (Writer)
router.post('/:id/image', authMiddleware, requireWriter, uploadBlogImage.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if user owns this blog
    const blogResult = await querySecure(
      'SELECT author_id, featured_image FROM blogs WHERE id = $1',
      [id]
    );

    if (blogResult.rows.length === 0) {
      deleteUploadedFile(req.file.path);
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blogResult.rows[0].author_id !== userId) {
      deleteUploadedFile(req.file.path);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete old featured image if exists
    if (blogResult.rows[0].featured_image) {
      const oldPath = path.join(__dirname, '../../', blogResult.rows[0].featured_image);
      deleteUploadedFile(oldPath);
    }

    const imageUrl = `/uploads/blog-images/${req.file.filename}`;

    await querySecure(
      'UPDATE blogs SET featured_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imageUrl, id]
    );

    res.json({
      message: 'Featured image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Upload blog image error:', error);
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete blog (Writer - own blogs only, Admin - all blogs)
router.delete('/:id', authMiddleware, requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user owns this blog
    const blogResult = await querySecure(
      'SELECT author_id, featured_image FROM blogs WHERE id = $1',
      [id]
    );

    if (blogResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blogResult.rows[0].author_id !== userId) {
      // Check if user is admin
      const roleResult = await querySecure(
        `SELECT role FROM user_roles 
         WHERE user_id = $1 AND role = 'admin' AND revoked_at IS NULL`,
        [userId]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Delete featured image if exists
    if (blogResult.rows[0].featured_image) {
      const imagePath = path.join(__dirname, '../../', blogResult.rows[0].featured_image);
      deleteUploadedFile(imagePath);
    }

    await querySecure('DELETE FROM blogs WHERE id = $1', [id]);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// Get all blogs with filters (Admin only)
router.get('/admin/all', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, author, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        b.*,
        u.username as author,
        u.email as author_email
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (author) {
      query += ` AND u.username ILIKE $${paramIndex}`;
      params.push(`%${author}%`);
      paramIndex++;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await querySecure(query, params);

    res.json({ blogs: result.rows });
  } catch (error) {
    console.error('Get all blogs (admin) error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Get blog statistics (Admin only)
router.get('/stats/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await querySecure(`
      SELECT 
        COUNT(*) as total_blogs,
        COUNT(*) FILTER (WHERE status = 'published') as published_blogs,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_blogs,
        SUM(views) as total_views,
        COUNT(DISTINCT author_id) as total_authors
      FROM blogs
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ error: 'Failed to fetch blog statistics' });
  }
});

export default router;
