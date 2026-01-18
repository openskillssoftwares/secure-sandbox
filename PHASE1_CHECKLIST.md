# Phase 1 Completion Checklist

## ✅ Completed Tasks

1. **Dependencies Installed** ✓
   - All Phase 1 npm packages installed successfully
   - OAuth libraries (passport, passport-google-oauth20, passport-github2)
   - File upload (multer, sharp)
   - Reporting (pdfkit, exceljs)

2. **Backend Code Implementation** ✓
   - OAuth configuration (`config/passport.ts`)
   - OAuth routes (`routes/oauth.routes.ts`)
   - Role middleware (`middleware/role.middleware.ts`)
   - Upload middleware (`middleware/upload.middleware.ts`)
   - Profile routes (`routes/profile.routes.ts`)
   - Bug report routes (`routes/bug-report.routes.ts`)
   - Blog routes (`routes/blog.routes.ts`)
   - Leaderboard routes (`routes/leaderboard.routes.ts`)
   - Enhanced admin routes (`routes/admin.routes.ts`)
   - Server integration (all routes mounted)

3. **Database Schema Created** ✓
   - Schema file: `database/schema-phase1-enhancements.sql`
   - 9 new tables defined
   - Views, triggers, and indexes created

4. **Configuration Files** ✓
   - `.env` file created with default values
   - Database setup script: `apply-schema.js`

5. **Documentation** ✓
   - `PHASE1_SETUP.md` - Complete setup guide
   - `PHASE1_COMPLETE.md` - Implementation summary

## ⚠️ Remaining Tasks

### 1. Start PostgreSQL Database

**Option A: Using Windows Services**
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-16

# Or use Services app (Win + R, type 'services.msc')
# Find 'postgresql-x64-16' and click Start
```

**Option B: Check if PostgreSQL is installed**
```powershell
# Check PostgreSQL installation
Get-Service -Name *postgres*

# If not installed, download from:
# https://www.postgresql.org/download/windows/
```

### 2. Create Database (if it doesn't exist)

```powershell
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE secure_pentest_db;
\q
```

Or use pgAdmin 4 to create the database.

### 3. Apply Database Schema

```powershell
cd backend
node apply-schema.js
```

This will:
- Connect to PostgreSQL
- Create 9 new tables (oauth_providers, user_profiles, bug_reports, blogs, user_roles, admin_activity_logs, leaderboard_cache)
- Create views, triggers, and indexes
- Add new columns to existing users table

### 4. Configure OAuth Credentials

Edit `backend/.env` and add your OAuth credentials:

#### Google OAuth:
1. Go to https://console.cloud.google.com/
2. Create/select a project
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add callback: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### GitHub OAuth:
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Homepage: `http://localhost:5173`
4. Callback: `http://localhost:5000/api/auth/github/callback`
5. Copy Client ID and Secret to `.env`:
   ```
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

### 5. Update Admin Email

In `backend/.env`, set your admin email:
```
ADMIN_EMAILS=your-email@example.com
```

### 6. Start the Backend Server

```powershell
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

### 7. Test the Implementation

#### Test OAuth:
- Google: http://localhost:5000/api/auth/google
- GitHub: http://localhost:5000/api/auth/github

#### Test API Endpoints (use Postman/Insomnia):

**Profile Management:**
```http
GET http://localhost:5000/api/profile/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Leaderboard:**
```http
GET http://localhost:5000/api/leaderboard
```

**Bug Reports:**
```http
POST http://localhost:5000/api/bugs/submit
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  "title": "Test Bug",
  "description": "This is a test bug report"
}
```

**Blogs (Public):**
```http
GET http://localhost:5000/api/blogs/published
```

**Admin Analytics:**
```http
GET http://localhost:5000/api/admin/analytics/dashboard
Authorization: Bearer YOUR_JWT_TOKEN (admin user)
```

### 8. Grant Admin Role

After creating your first user account, grant admin role:

```sql
-- Connect to database
psql -U postgres -d secure_pentest_db

-- Insert admin role (replace USER_ID with your user's UUID)
INSERT INTO user_roles (user_id, role, granted_by)
VALUES ('your-user-id-here', 'admin', 'your-user-id-here');
```

Or use the database GUI tool to add a row to the `user_roles` table.

## Quick Start Command Summary

```powershell
# 1. Start PostgreSQL (if not running)
Start-Service postgresql-x64-16

# 2. Apply database schema
cd backend
node apply-schema.js

# 3. Configure OAuth in .env (manual step)
# Edit backend/.env with your credentials

# 4. Start backend server
npm run dev

# 5. In another terminal, start frontend
cd ..
npm run dev
```

## Troubleshooting

### PostgreSQL Not Running
```powershell
# Check status
Get-Service postgresql-x64-16

# Start service
Start-Service postgresql-x64-16
```

### Database Connection Error
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database `secure_pentest_db` exists

### OAuth Not Working
- Verify callback URLs match exactly
- Check CLIENT_ID and CLIENT_SECRET in `.env`
- Ensure FRONTEND_URL is set correctly

### File Upload Errors
- Directories created automatically on server start
- Check file size limits in `.env`
- Verify Sharp library installed correctly

### Admin Access Denied
- Ensure user has admin role in `user_roles` table
- Check ADMIN_EMAILS in `.env` includes your email

## What's Working

After completing the above steps, you'll have:

✅ OAuth authentication (Google & GitHub)  
✅ User profile management with picture uploads  
✅ Role-based access control (admin, writer, moderator)  
✅ Bug reporting system with screenshots  
✅ Blog management system  
✅ Global and lab-specific leaderboards  
✅ Admin panel with analytics and reports  
✅ PDF/Excel export functionality  

## Next: Phase 2

Once Phase 1 is fully tested and working, proceed to Phase 2:
- User Dashboard UI components
- Profile settings interface
- Labs progress visualization
- Leaderboard display
- Payment management UI

See `PHASE1_SETUP.md` for detailed documentation.
