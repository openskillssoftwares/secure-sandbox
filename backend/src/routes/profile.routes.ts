import express, { Request, Response } from 'express';
import { querySecure } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { uploadProfilePicture, deleteUploadedFile } from '../middleware/upload.middleware';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await querySecure(
      `SELECT 
        u.id, u.email, u.username, u.full_name, u.profile_picture, u.oauth_provider,
        u.created_at, u.last_login, u.subscription_plan, u.subscription_end_date,
        up.bio, up.location, up.website, up.github_url, up.linkedin_url, up.twitter_url,
        up.total_score, up.rank, up.labs_completed, up.achievements,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND completed = TRUE) as labs_solved,
        (SELECT json_agg(json_build_object('role', role, 'granted_at', granted_at)) 
         FROM user_roles WHERE user_id = u.id AND revoked_at IS NULL) as roles
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      full_name,
      bio,
      location,
      website,
      github_url,
      linkedin_url,
      twitter_url,
    } = req.body;

    // Update users table
    if (full_name) {
      await querySecure(
        'UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [full_name, userId]
      );
    }

    // Update user_profiles table
    await querySecure(
      `INSERT INTO user_profiles (user_id, bio, location, website, github_url, linkedin_url, twitter_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         bio = COALESCE($2, user_profiles.bio),
         location = COALESCE($3, user_profiles.location),
         website = COALESCE($4, user_profiles.website),
         github_url = COALESCE($5, user_profiles.github_url),
         linkedin_url = COALESCE($6, user_profiles.linkedin_url),
         twitter_url = COALESCE($7, user_profiles.twitter_url),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, bio, location, website, github_url, linkedin_url, twitter_url]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/profile/picture', authMiddleware, uploadProfilePicture.single('picture'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process image with Sharp
    const processedFilename = `processed-${req.file.filename}`;
    const processedPath = path.join(path.dirname(req.file.path), processedFilename);

    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(processedPath);

    // Delete original file
    deleteUploadedFile(req.file.path);

    // Get old profile picture to delete
    const oldPictureResult = await querySecure(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userId]
    );

    if (oldPictureResult.rows[0]?.profile_picture) {
      const oldPath = path.join(__dirname, '../../uploads/profiles', path.basename(oldPictureResult.rows[0].profile_picture));
      deleteUploadedFile(oldPath);
    }

    // Update database with new picture URL
    const pictureUrl = `/uploads/profiles/${processedFilename}`;
    await querySecure(
      'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [pictureUrl, userId]
    );

    await querySecure(
      `INSERT INTO user_profiles (user_id, profile_picture, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         profile_picture = $2,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, pictureUrl]
    );

    res.json({ 
      message: 'Profile picture uploaded successfully',
      pictureUrl 
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Change username
router.put('/profile/username', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    // Check if username is taken
    const existingUser = await querySecure(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    await querySecure(
      'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [username, userId]
    );

    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    console.error('Change username error:', error);
    res.status(500).json({ error: 'Failed to change username' });
  }
});

// Change email
router.put('/profile/email', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user's current data
    const userResult = await querySecure(
      'SELECT email, password_hash, oauth_provider FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if OAuth user
    if (user.oauth_provider) {
      return res.status(400).json({ error: 'Cannot change email for OAuth users' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if email is taken
    const existingUser = await querySecure(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await querySecure(
      'UPDATE users SET email = $1, email_verified = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [email, userId]
    );

    res.json({ message: 'Email updated successfully. Please verify your new email.' });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ error: 'Failed to change email' });
  }
});

// Change password
router.put('/profile/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user's current data
    const userResult = await querySecure(
      'SELECT password_hash, oauth_provider FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if OAuth user
    if (user.oauth_provider) {
      return res.status(400).json({ error: 'Cannot change password for OAuth users' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await querySecure(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete account
router.delete('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { password, confirmation } = req.body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ error: 'Invalid confirmation text' });
    }

    // Get user's data
    const userResult = await querySecure(
      'SELECT password_hash, oauth_provider, profile_picture FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify password for non-OAuth users
    if (!user.oauth_provider) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Delete profile picture if exists
    if (user.profile_picture) {
      const picturePath = path.join(__dirname, '../../', user.profile_picture);
      deleteUploadedFile(picturePath);
    }

    // Delete user (cascade will handle related records)
    await querySecure('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get user's labs progress
router.get('/labs/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await querySecure(
      `SELECT 
        up.lab_type,
        up.started_at,
        up.completed_at,
        up.completed,
        up.score,
        up.attempts,
        up.hints_used
       FROM user_progress up
       WHERE up.user_id = $1
       ORDER BY up.started_at DESC`,
      [userId]
    );

    res.json({ progress: result.rows });
  } catch (error) {
    console.error('Get labs progress error:', error);
    res.status(500).json({ error: 'Failed to fetch labs progress' });
  }
});

// Get payment history
router.get('/payments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await querySecure(
      `SELECT 
        id,
        order_id,
        payment_id,
        amount,
        currency,
        status,
        subscription_plan,
        created_at
       FROM payment_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
