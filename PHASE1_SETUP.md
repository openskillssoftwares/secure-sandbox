# Phase 1 Setup Guide: OAuth & Enhanced Backend

This guide covers the setup for Phase 1 of the pentest platform overhaul, which includes OAuth authentication, enhanced backend routes, profile management, bug reports, blogs, and leaderboards.

## Table of Contents
1. [Installation](#installation)
2. [Database Setup](#database-setup)
3. [OAuth Configuration](#oauth-configuration)
4. [Environment Variables](#environment-variables)
5. [Testing](#testing)
6. [Features Overview](#features-overview)

---

## Installation

### 1. Install Backend Dependencies

Navigate to the backend directory and install all dependencies:

```bash
cd backend
npm install
```

### New Dependencies Added in Phase 1:
- **OAuth**: `passport`, `passport-google-oauth20`, `passport-github2`
- **Sessions**: `express-session`
- **File Uploads**: `multer`, `sharp` (image processing)
- **Reporting**: `pdfkit`, `exceljs`
- **TypeScript Types**: All corresponding @types packages

---

## Database Setup

### 1. Apply Schema Enhancements

The new schema adds 9 tables, views, triggers, and indexes. Execute the schema enhancement file:

```bash
# Option 1: Using psql command line
psql -U postgres -d secure_pentest_db -f backend/database/schema-phase1-enhancements.sql

# Option 2: Using pgAdmin or any PostgreSQL client
# Copy the contents of backend/database/schema-phase1-enhancements.sql
# and execute in your SQL query tool
```

### New Tables Created:
1. **oauth_providers** - Links users to Google/GitHub accounts
2. **user_profiles** - Extended user information (bio, social links, scores)
3. **bug_reports** - User-submitted bug reports with screenshots
4. **blogs** - Blog/content management system
5. **user_roles** - Role-based access control (admin, writer, moderator)
6. **admin_activity_logs** - Audit trail for admin actions
7. **leaderboard_cache** - Performance-optimized leaderboard data

### New Views:
- **user_rankings** - Real-time leaderboard with rankings

### New Functions:
- **update_leaderboard_cache()** - Automatic leaderboard updates

---

## OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
8. Copy **Client ID** and **Client Secret**

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:5173` (development)
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

---

## Environment Variables

### 1. Create .env File

Copy `.env.example` to `.env` in the backend directory:

```bash
cd backend
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` and add your credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Session Secret (generate a random string)
SESSION_SECRET=your-very-long-and-secure-random-session-secret

# API and Frontend URLs
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Database (verify these match your setup)
DB_SECURE_HOST=localhost
DB_SECURE_PORT=5432
DB_SECURE_NAME=secure_pentest_db
DB_SECURE_USER=postgres
DB_SECURE_PASSWORD=your_password
```

---

## Testing

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║                                                                 ║
║   🛡️  Secure Pentest Sandbox - Backend Server                 ║
║                                                                 ║
║   Server running on: http://localhost:5000                     ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
```

### 2. Test OAuth Routes

#### Google OAuth:
1. Navigate to: `http://localhost:5000/api/auth/google`
2. Sign in with Google account
3. Should redirect to frontend with JWT tokens

#### GitHub OAuth:
1. Navigate to: `http://localhost:5000/api/auth/github`
2. Authorize with GitHub
3. Should redirect to frontend with JWT tokens

### 3. Test API Endpoints

Use tools like Postman, Insomnia, or cURL to test:

#### Profile Routes (requires authentication):
- `GET /api/profile/profile` - Get user profile
- `PUT /api/profile/profile` - Update profile
- `POST /api/profile/picture` - Upload profile picture
- `PUT /api/profile/username` - Change username
- `PUT /api/profile/email` - Change email
- `PUT /api/profile/password` - Change password
- `DELETE /api/profile` - Delete account

#### Bug Report Routes:
- `POST /api/bugs/submit` - Submit bug report (with screenshots)
- `GET /api/bugs/my-reports` - Get user's reports
- `GET /api/bugs/all` - Get all reports (admin/moderator only)

#### Blog Routes:
- `GET /api/blogs/published` - Get published blogs (public)
- `GET /api/blogs/published/:slug` - Get single blog (public)
- `GET /api/blogs/my-blogs` - Get user's blogs (writer only)
- `POST /api/blogs` - Create new blog (writer only)
- `PUT /api/blogs/:id` - Update blog (writer only)

#### Leaderboard Routes:
- `GET /api/leaderboard` - Get global leaderboard (public)
- `GET /api/leaderboard/me` - Get user's rank (authenticated)
- `GET /api/leaderboard/lab/:labType` - Get lab-specific leaderboard

#### Admin Routes (requires admin role):
- `GET /api/admin/users` - Get all users with filters
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/roles` - Grant role to user
- `DELETE /api/admin/users/:id/roles/:role` - Revoke role
- `GET /api/admin/labs` - Get all labs
- `POST /api/admin/labs` - Add new lab
- `PUT /api/admin/labs/:labType` - Update lab
- `GET /api/admin/analytics/dashboard` - Get analytics
- `GET /api/admin/reports/users/pdf` - Export users as PDF
- `GET /api/admin/reports/users/excel` - Export users as Excel

---

## Features Overview

### 1. OAuth Authentication
- **Google Sign-In**: Users can register/login with Google
- **GitHub Sign-In**: Users can register/login with GitHub
- **Account Linking**: OAuth accounts automatically link to existing email addresses
- **JWT Integration**: OAuth creates JWT tokens for API authentication

### 2. Enhanced User Profiles
- **Profile Pictures**: Upload and process images (resized to 400x400)
- **Extended Info**: Bio, location, website, social links
- **Score Tracking**: Total score, rank, labs completed
- **Account Management**: Change username, email, password, delete account

### 3. Bug Reporting System
- **User Submissions**: Users can report bugs with descriptions
- **Screenshot Uploads**: Up to 5 screenshots per report
- **Severity Levels**: Critical, high, medium, low
- **Admin Management**: Admins can update status, add notes
- **Status Tracking**: Open, in progress, resolved, closed, won't fix

### 4. Blog/Content System
- **Writer Panel**: Special role for content creators
- **Rich Editor Support**: Full HTML content support
- **Featured Images**: Upload images for blog posts
- **Draft/Published**: Control blog visibility
- **SEO-Friendly**: Auto-generate slugs from titles
- **View Tracking**: Track blog post views

### 5. Leaderboard System
- **Global Rankings**: Overall user rankings by total score
- **Lab-Specific**: Leaderboard for each individual lab
- **Performance Optimized**: Cached rankings updated automatically
- **Weekly/Monthly**: Top performers tracking
- **User Position**: See your rank and nearby users

### 6. Role-Based Access Control
- **Admin Role**: Full system access, user management, analytics
- **Writer Role**: Blog creation and management
- **Moderator Role**: Bug report management
- **Role Grant/Revoke**: Admins can manage user roles
- **Activity Logging**: All admin actions are logged

### 7. Admin Dashboard Features
- **User Management**: View, edit, delete users, manage roles
- **Lab Management**: Add, edit, delete labs, change instructions
- **Payment Tracking**: View all transactions, filter by date/status
- **Analytics**: User stats, revenue, lab completion rates
- **Report Generation**: Export data as PDF or Excel
- **Activity Logs**: Audit trail of all admin actions

### 8. File Upload System
- **Profile Pictures**: Max 5MB, auto-resized to 400x400
- **Bug Screenshots**: Max 10MB per image, up to 5 images
- **Blog Images**: Max 10MB for featured images
- **Image Processing**: Automatic optimization with Sharp

---

## File Structure

### New Files Created:
```
backend/
├── database/
│   └── schema-phase1-enhancements.sql  # New database tables
├── src/
│   ├── config/
│   │   └── passport.ts  # OAuth configuration
│   ├── middleware/
│   │   ├── role.middleware.ts  # Role-based access control
│   │   └── upload.middleware.ts  # File upload handling
│   └── routes/
│       ├── oauth.routes.ts  # OAuth authentication routes
│       ├── profile.routes.ts  # User profile management
│       ├── bug-report.routes.ts  # Bug reporting system
│       ├── blog.routes.ts  # Blog management
│       ├── leaderboard.routes.ts  # Leaderboard endpoints
│       └── admin.routes.ts  # Admin panel (enhanced)
└── uploads/  # Created automatically
    ├── profiles/  # Profile pictures
    ├── bug-screenshots/  # Bug report images
    └── blog-images/  # Blog featured images
```

---

## Next Steps

### Phase 2: User Dashboard UI
- React components for user dashboard
- Profile settings page
- Labs progress visualization
- Payment management UI
- Leaderboard display

### Phase 3: Admin & Writer Dashboards
- Admin panel UI
- User management interface
- Lab management interface
- Analytics dashboard
- Writer panel for blog management

---

## Troubleshooting

### OAuth Redirect Issues
- Verify callback URLs match exactly in OAuth provider settings
- Check `API_URL` and `FRONTEND_URL` in `.env`
- Ensure no trailing slashes in URLs

### Database Connection Errors
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `secure_pentest_db` exists
- Run schema enhancement file if tables are missing

### File Upload Errors
- Check directory permissions for `backend/uploads`
- Verify file size limits in `.env`
- Ensure Sharp library installed correctly (may need rebuild on some systems)

### Role Permission Errors
- Manually insert admin role in database:
  ```sql
  INSERT INTO user_roles (user_id, role, granted_by)
  VALUES ('your-user-id', 'admin', 'your-user-id');
  ```
- Verify `ADMIN_EMAILS` in `.env` includes your email

---

## Support

For issues or questions about Phase 1 implementation, check:
1. Database logs: Ensure schema applied successfully
2. Server logs: Check for OAuth or file upload errors
3. Environment variables: Verify all required variables set
4. OAuth provider settings: Ensure callback URLs configured correctly

Phase 1 provides the foundation for the complete platform. Once tested and working, proceed to Phase 2 for UI development.
