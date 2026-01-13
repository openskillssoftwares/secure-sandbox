import { Request, Response, NextFunction } from 'express';
import { querySecure } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    // Check if user has admin role
    const roleResult = await querySecure(
      `SELECT ur.role FROM user_roles ur 
       WHERE ur.user_id = $1 AND ur.role = 'admin' AND ur.revoked_at IS NULL`,
      [userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to require writer role
 */
export const requireWriter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    // Check if user has writer or admin role
    const roleResult = await querySecure(
      `SELECT ur.role FROM user_roles ur 
       WHERE ur.user_id = $1 AND ur.role IN ('writer', 'admin') AND ur.revoked_at IS NULL`,
      [userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Writer role required.' });
    }

    next();
  } catch (error) {
    console.error('Writer check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to require moderator role
 */
export const requireModerator = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    // Check if user has moderator or admin role
    const roleResult = await querySecure(
      `SELECT ur.role FROM user_roles ur 
       WHERE ur.user_id = $1 AND ur.role IN ('moderator', 'admin') AND ur.revoked_at IS NULL`,
      [userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Moderator role required.' });
    }

    next();
  } catch (error) {
    console.error('Moderator check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Generic middleware to require specific role(s)
 */
export const requireRole = (roles: string | string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = req.user.userId;
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      // Check if user has any of the required roles
      const roleResult = await querySecure(
        `SELECT ur.role FROM user_roles ur 
         WHERE ur.user_id = $1 AND ur.role = ANY($2) AND ur.revoked_at IS NULL`,
        [userId, rolesArray]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ 
          error: `Access denied. Required role(s): ${rolesArray.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Check if user is admin (returns boolean)
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const roleResult = await querySecure(
      `SELECT 1 FROM user_roles 
       WHERE user_id = $1 AND role = 'admin' AND revoked_at IS NULL LIMIT 1`,
      [userId]
    );
    return roleResult.rows.length > 0;
  } catch (error) {
    console.error('isAdmin check error:', error);
    return false;
  }
};

/**
 * Check if user has specific role (returns boolean)
 */
export const hasRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    const roleResult = await querySecure(
      `SELECT 1 FROM user_roles 
       WHERE user_id = $1 AND role = $2 AND revoked_at IS NULL LIMIT 1`,
      [userId, role]
    );
    return roleResult.rows.length > 0;
  } catch (error) {
    console.error('hasRole check error:', error);
    return false;
  }
};

/**
 * Get all roles for a user
 */
export const getUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const result = await querySecure(
      `SELECT role FROM user_roles 
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
    return result.rows.map(row => row.role);
  } catch (error) {
    console.error('getUserRoles error:', error);
    return [];
  }
};
