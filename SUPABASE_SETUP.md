# Supabase Setup Guide for Pentest Sandbox Platform

This guide will walk you through setting up Supabase for your Pentest Sandbox platform with complete authentication, database, and storage functionality.

## Table of Contents
1. [Create Supabase Project](#1-create-supabase-project)
2. [Configure Environment Variables](#2-configure-environment-variables)
3. [Set Up Database Schema](#3-set-up-database-schema)
4. [Configure OAuth Providers](#4-configure-oauth-providers)
5. [Set Up Storage Buckets](#5-set-up-storage-buckets)
6. [Update Application Routes](#6-update-application-routes)
7. [Test Authentication](#7-test-authentication)
8. [Next Steps](#8-next-steps)

---

## 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Enter project details:
   - **Name**: pentest-sandbox (or your preferred name)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** (this takes ~2 minutes)

---

## 2. Configure Environment Variables

### Get Your Supabase Credentials

1. In your Supabase project, click **Settings** (gear icon) in the sidebar
2. Go to **API** section
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGc...`)

### Update .env File

Open `.env` in the root directory and replace the placeholders:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

**Important**: Never commit the `.env` file to git. It should be in your `.gitignore`.

---

## 3. Set Up Database Schema

### Apply the Schema

1. In your Supabase project, click **SQL Editor** in the sidebar
2. Click **"+ New query"**
3. Open the file `supabase/schema.sql` in your project
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see "Success. No rows returned" message

### Verify Tables Created

1. Click **Database** in sidebar
2. Click **Tables**
3. You should see the following tables:
   - ✅ profiles
   - ✅ user_roles
   - ✅ oauth_providers
   - ✅ bug_reports
   - ✅ blogs
   - ✅ lab_progress
   - ✅ payment_history
   - ✅ user_subscriptions
   - ✅ admin_activity_logs

### Verify Views Created

1. In Database section, scroll down to **Views**
2. You should see:
   - ✅ leaderboard_global
   - ✅ leaderboard_weekly
   - ✅ leaderboard_monthly

---

## 4. Configure OAuth Providers

### Google OAuth Setup

#### Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
5. Choose **Web application**
6. Name: "Pentest Sandbox"
7. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (for development)
   - `https://your-production-domain.com` (for production)
8. Add **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback`
9. Click **"Create"**
10. Copy the **Client ID** and **Client Secret**

#### Step 2: Configure in Supabase

1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable **"Google Enabled"** toggle
4. Paste your **Client ID** and **Client Secret**
5. Click **"Save"**

### GitHub OAuth Setup

#### Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in details:
   - **Application name**: Pentest Sandbox
   - **Homepage URL**: `http://localhost:5173` (or your production URL)
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

#### Step 2: Configure in Supabase

1. In Supabase, go to **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Enable **"GitHub Enabled"** toggle
4. Paste your **Client ID** and **Client Secret**
5. Click **"Save"**

### Configure Email Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (should be by default)
3. Configure email settings:
   - **Enable email confirmations**: ON (recommended)
   - **Secure email change**: ON (recommended)
4. Go to **Authentication** → **Email Templates** to customize:
   - Confirmation email
   - Password reset email
   - Magic link email

---

## 5. Set Up Storage Buckets

### Create Storage Buckets

1. In Supabase, go to **Storage** in sidebar
2. Click **"+ New bucket"**
3. Create the following buckets:

#### Bucket 1: profile-avatars
- **Name**: `profile-avatars`
- **Public bucket**: ✅ YES
- Click **"Create bucket"**

#### Bucket 2: bug-screenshots
- **Name**: `bug-screenshots`
- **Public bucket**: ❌ NO
- Click **"Create bucket"**

#### Bucket 3: blog-images
- **Name**: `blog-images`
- **Public bucket**: ✅ YES
- Click **"Create bucket"**

### Set Up Storage Policies

The RLS policies for storage are automatically handled by the database schema, but you can verify:

1. Click on each bucket
2. Go to **Policies** tab
3. You should see policies matching the user permissions

---

## 6. Update Application Routes

### Add OAuth Callback Route

Update your `src/main.tsx` or router configuration to include the auth callback:

```tsx
import AuthCallback from '@/pages/AuthCallback';

// Add this route to your router:
{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

### Example Router Update (if using React Router)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthCallback from '@/pages/AuthCallback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... existing routes ... */}
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 7. Test Authentication

### Test Email/Password Registration

1. Run your development server: `npm run dev`
2. Navigate to `http://localhost:5173/signup`
3. Create an account with:
   - Full name
   - Username
   - Email
   - Strong password
4. Check your email for verification link
5. Click verification link
6. You should be logged in automatically

### Test Google OAuth

1. Go to `http://localhost:5173/login`
2. Click **"Google"** button
3. Sign in with your Google account
4. You should be redirected back and logged in
5. Check Supabase Dashboard → **Authentication** → **Users** to see your user

### Test GitHub OAuth

1. Go to `http://localhost:5173/login`
2. Click **"GitHub"** button
3. Authorize the application
4. You should be redirected back and logged in

### Verify Database Entries

1. Go to Supabase Dashboard → **Table Editor**
2. Check **profiles** table - should have your profile
3. Check **user_roles** table - should have 'user' role assigned
4. Check **user_subscriptions** table - should have 'free' tier

---

## 8. Next Steps

### Features Now Available

✅ **User Authentication**
- Email/password signup and login
- Google OAuth
- GitHub OAuth
- Email verification
- Password reset

✅ **User Management**
- Automatic profile creation
- Role-based access control (user, writer, moderator, admin)
- User subscriptions tracking

✅ **Database Tables Ready**
- Bug reporting system
- Blog management
- Lab progress tracking
- Leaderboards (global, weekly, monthly)
- Payment history
- Admin activity logs

### Implement Additional Features

Now that authentication is set up, you can implement:

1. **User Dashboard**
   - Display profile information
   - Show lab progress
   - View leaderboard ranking

2. **Bug Report System**
   - Create bug submission form
   - Admin interface to manage reports

3. **Blog System**
   - Writer interface for creating blogs
   - Public blog viewing

4. **Leaderboard**
   - Display rankings using the views created
   - Show user's position

5. **Admin Panel**
   - User management
   - Lab management
   - Analytics dashboard

### Useful Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Auth Guide**: https://supabase.com/docs/guides/auth
- **Supabase Database Guide**: https://supabase.com/docs/guides/database
- **Supabase Storage Guide**: https://supabase.com/docs/guides/storage
- **Row Level Security (RLS)**: https://supabase.com/docs/guides/auth/row-level-security

---

## Troubleshooting

### "Invalid API key" Error
- Check that your `.env` file has correct values
- Restart your development server after changing `.env`
- Verify you're using the **anon public** key, not the service key

### OAuth Not Working
- Verify redirect URLs match exactly (including https/http)
- Check OAuth provider configuration in Supabase
- Ensure callback route `/auth/callback` exists in your app

### Tables Not Appearing
- Verify schema.sql ran without errors
- Check SQL Editor for error messages
- Try running schema sections one at a time

### Email Verification Not Sending
- Check Supabase → Authentication → Email Templates
- For development, check Supabase → Authentication → Users → Email tab
- Consider using a custom SMTP provider for production

### RLS Policy Errors
- Verify user is authenticated (check `auth.uid()`)
- Check Supabase → Authentication → Policies for each table
- Test policies in SQL Editor with: `SELECT auth.uid();`

---

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Enable RLS on all tables (already done in schema)
- [ ] Configure SMTP for production emails
- [ ] Set up proper OAuth redirect URLs for production domain
- [ ] Enable database backups in Supabase
- [ ] Set up monitoring and alerts
- [ ] Review and test all RLS policies
- [ ] Never commit `.env` file to version control
- [ ] Use environment-specific OAuth credentials
- [ ] Enable Supabase rate limiting

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for JavaScript errors
4. Verify database schema was applied correctly
5. Consult Supabase documentation

**Need help?** Join the Supabase Discord: https://discord.supabase.com
