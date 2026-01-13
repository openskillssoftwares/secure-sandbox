import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration for profile pictures
export const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFileFilter,
});

// Storage configuration for bug report screenshots
const bugScreenshotStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const bugUploadDir = path.join(__dirname, '../../uploads/bug-screenshots');
    if (!fs.existsSync(bugUploadDir)) {
      fs.mkdirSync(bugUploadDir, { recursive: true });
    }
    cb(null, bugUploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `bug-screenshot-${uniqueSuffix}${ext}`);
  }
});

// Multer upload configuration for bug screenshots
export const uploadBugScreenshots = multer({
  storage: bugScreenshotStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files
  },
  fileFilter: imageFileFilter,
});

// Storage configuration for blog featured images
const blogImageStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const blogUploadDir = path.join(__dirname, '../../uploads/blog-images');
    if (!fs.existsSync(blogUploadDir)) {
      fs.mkdirSync(blogUploadDir, { recursive: true });
    }
    cb(null, blogUploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `blog-image-${uniqueSuffix}${ext}`);
  }
});

// Multer upload configuration for blog images
export const uploadBlogImage = multer({
  storage: blogImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: imageFileFilter,
});

// Helper function to delete uploaded files
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
