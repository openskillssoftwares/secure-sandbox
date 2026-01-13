import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { testSecureConnection, testVulnerableConnection } from './config/database';
import passport from './config/passport';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import sandboxRoutes from './routes/sandbox.routes';
import labRoutes from './routes/lab.routes';
import adminRoutes from './routes/admin.routes';
import oauthRoutes from './routes/oauth.routes';
import profileRoutes from './routes/profile.routes';
import bugReportRoutes from './routes/bug-report.routes';
import blogRoutes from './routes/blog.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '../uploads/profiles'),
  path.join(__dirname, '../uploads/bug-screenshots'),
  path.join(__dirname, '../uploads/blog-images'),
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Session middleware (required for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);  // OAuth routes
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);  // Profile routes
app.use('/api/payment', paymentRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugReportRoutes);  // Bug report routes
app.use('/api/blogs', blogRoutes);  // Blog routes
app.use('/api/leaderboard', leaderboardRoutes);  // Leaderboard routes

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server
async function startServer() {
  try {
    // Test database connections
    const secureConnected = await testSecureConnection();
    const vulnerableConnected = await testVulnerableConnection();
    
    if (!secureConnected) {
      console.warn('⚠️  Secure database not connected. Some features may not work.');
    }
    
    if (!vulnerableConnected) {
      console.warn('⚠️  Vulnerable database not connected. Practice labs will not work.');
    }
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                                 ║
║   🛡️  Secure Pentest Sandbox - Backend Server                 ║
║                                                                 ║
║   Server running on: http://localhost:${PORT}                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
║   API Base: http://localhost:${PORT}/api                       ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
