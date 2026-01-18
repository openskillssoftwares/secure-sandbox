-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR PENTEST SANDBOX PLATFORM
-- Phase 1: Complete User Management & Features
-- =====================================================
-- This schema includes all tables needed for:
-- - User authentication (handled by Supabase Auth)
-- - User profiles with avatars
-- - Role-based access control (admin, writer, moderator, user)
-- - Bug reporting system
-- - Blog management
-- - Leaderboard & progress tracking
-- - Payment history
-- - Admin activity logging
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    github_username TEXT,
    twitter_username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- =====================================================
-- 2. USER ROLES TABLE
-- =====================================================
-- Role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'writer', 'admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one role per user
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Index for role lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- 3. OAUTH PROVIDERS TABLE
-- =====================================================
-- Track which OAuth providers users have connected
CREATE TABLE public.oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'email')),
    provider_user_id TEXT,
    provider_email TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one provider per user
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Index for provider lookups
CREATE INDEX idx_oauth_providers_user_id ON public.oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON public.oauth_providers(provider);

-- =====================================================
-- 4. BUG REPORTS TABLE
-- =====================================================
-- User bug report submissions
CREATE TABLE public.bug_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
    lab_name TEXT,
    browser TEXT,
    os TEXT,
    screenshot_url TEXT,
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 200)
);

-- Indexes for bug report queries
CREATE INDEX idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_severity ON public.bug_reports(severity);
CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at DESC);

-- =====================================================
-- 5. BLOGS TABLE
-- =====================================================
-- Blog posts (writer role required)
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for blog queries
CREATE INDEX idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE INDEX idx_blogs_status ON public.blogs(status);
CREATE INDEX idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN(tags);

-- =====================================================
-- 6. LAB PROGRESS TABLE
-- =====================================================
-- Track user progress on labs
CREATE TABLE public.lab_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lab_id TEXT NOT NULL,
    lab_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one progress entry per user per lab
    CONSTRAINT unique_user_lab UNIQUE (user_id, lab_id)
);

-- Indexes for lab progress queries
CREATE INDEX idx_lab_progress_user_id ON public.lab_progress(user_id);
CREATE INDEX idx_lab_progress_lab_id ON public.lab_progress(lab_id);
CREATE INDEX idx_lab_progress_status ON public.lab_progress(status);
CREATE INDEX idx_lab_progress_completed_at ON public.lab_progress(completed_at DESC);

-- =====================================================
-- 7. PAYMENT HISTORY TABLE
-- =====================================================
-- Track user subscription payments
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    receipt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payment queries
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(payment_status);
CREATE INDEX idx_payment_history_created_at ON public.payment_history(created_at DESC);

-- =====================================================
-- 8. USER SUBSCRIPTIONS TABLE
-- =====================================================
-- Current subscription status
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one active subscription per user
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Index for subscription lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- =====================================================
-- 9. ADMIN ACTIVITY LOG TABLE
-- =====================================================
-- Track admin actions for audit purposes
CREATE TABLE public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin log queries
CREATE INDEX idx_admin_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON public.admin_activity_logs(action);
CREATE INDEX idx_admin_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- =====================================================
-- VIEWS FOR LEADERBOARD
-- =====================================================
-- Global leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_global AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COUNT(DISTINCT lp.lab_id) as labs_completed,
    SUM(lp.score) as total_score,
    AVG(lp.time_spent_seconds) as avg_time_seconds,
    MAX(lp.completed_at) as last_completion,
    ROW_NUMBER() OVER (ORDER BY SUM(lp.score) DESC, COUNT(DISTINCT lp.lab_id) DESC) as rank
FROM public.profiles p
INNER JOIN public.lab_progress lp ON p.id = lp.user_id
WHERE lp.status = 'completed'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_score DESC, labs_completed DESC;

-- Weekly leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COUNT(DISTINCT lp.lab_id) as labs_completed,
    SUM(lp.score) as total_score,
    AVG(lp.time_spent_seconds) as avg_time_seconds,
    MAX(lp.completed_at) as last_completion,
    ROW_NUMBER() OVER (ORDER BY SUM(lp.score) DESC, COUNT(DISTINCT lp.lab_id) DESC) as rank
FROM public.profiles p
INNER JOIN public.lab_progress lp ON p.id = lp.user_id
WHERE lp.status = 'completed' 
    AND lp.completed_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_score DESC, labs_completed DESC;

-- Monthly leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_monthly AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COUNT(DISTINCT lp.lab_id) as labs_completed,
    SUM(lp.score) as total_score,
    AVG(lp.time_spent_seconds) as avg_time_seconds,
    MAX(lp.completed_at) as last_completion,
    ROW_NUMBER() OVER (ORDER BY SUM(lp.score) DESC, COUNT(DISTINCT lp.lab_id) DESC) as rank
FROM public.profiles p
INNER JOIN public.lab_progress lp ON p.id = lp.user_id
WHERE lp.status = 'completed' 
    AND lp.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_score DESC, labs_completed DESC;

-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_bug_reports_updated_at ON public.bug_reports;
CREATE TRIGGER trigger_bug_reports_updated_at
    BEFORE UPDATE ON public.bug_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_blogs_updated_at ON public.blogs;
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_lab_progress_updated_at ON public.lab_progress;
CREATE TRIGGER trigger_lab_progress_updated_at
    BEFORE UPDATE ON public.lab_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_payment_history_updated_at ON public.payment_history;
CREATE TRIGGER trigger_payment_history_updated_at
    BEFORE UPDATE ON public.payment_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER trigger_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create default subscription
    INSERT INTO public.user_subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow manual)
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER ROLES POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Anyone can view roles (needed for role checks)
CREATE POLICY "Roles are viewable by everyone"
    ON public.user_roles FOR SELECT
    USING (true);

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- OAUTH PROVIDERS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own OAuth providers" ON public.oauth_providers;
DROP POLICY IF EXISTS "Users can manage own OAuth providers" ON public.oauth_providers;

-- Users can view their own OAuth providers
CREATE POLICY "Users can view own OAuth providers"
    ON public.oauth_providers FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own OAuth providers
CREATE POLICY "Users can manage own OAuth providers"
    ON public.oauth_providers FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- BUG REPORTS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Users can create bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports"
    ON public.bug_reports FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create bug reports
CREATE POLICY "Users can create bug reports"
    ON public.bug_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports"
    ON public.bug_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports"
    ON public.bug_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- =====================================================
-- BLOGS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published blogs are viewable by everyone" ON public.blogs;
DROP POLICY IF EXISTS "Writers can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can update own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update any blog" ON public.blogs;
DROP POLICY IF EXISTS "Authors can delete own blogs" ON public.blogs;

-- Everyone can view published blogs
CREATE POLICY "Published blogs are viewable by everyone"
    ON public.blogs FOR SELECT
    USING (status = 'published' OR auth.uid() = author_id);

-- Writers can create blogs
CREATE POLICY "Writers can create blogs"
    ON public.blogs FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('writer', 'admin')
        )
    );

-- Authors can update their own blogs
CREATE POLICY "Authors can update own blogs"
    ON public.blogs FOR UPDATE
    USING (auth.uid() = author_id);

-- Admins can update any blog
CREATE POLICY "Admins can update any blog"
    ON public.blogs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Authors can delete their own blogs
CREATE POLICY "Authors can delete own blogs"
    ON public.blogs FOR DELETE
    USING (auth.uid() = author_id);

-- =====================================================
-- LAB PROGRESS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own lab progress" ON public.lab_progress;
DROP POLICY IF EXISTS "Users can manage own lab progress" ON public.lab_progress;
DROP POLICY IF EXISTS "Admins can view all lab progress" ON public.lab_progress;

-- Users can view their own lab progress
CREATE POLICY "Users can view own lab progress"
    ON public.lab_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own lab progress
CREATE POLICY "Users can manage own lab progress"
    ON public.lab_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all lab progress
CREATE POLICY "Admins can view all lab progress"
    ON public.lab_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PAYMENT HISTORY POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
DROP POLICY IF EXISTS "System can insert payment records" ON public.payment_history;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_history;

-- Users can view their own payment history
CREATE POLICY "Users can view own payment history"
    ON public.payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert payment records (authenticated users)
CREATE POLICY "System can insert payment records"
    ON public.payment_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
    ON public.payment_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- USER SUBSCRIPTIONS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can update any subscription" ON public.user_subscriptions;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
    ON public.user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON public.user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update any subscription
CREATE POLICY "Admins can update any subscription"
    ON public.user_subscriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ADMIN ACTIVITY LOGS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Only admins can insert activity logs" ON public.admin_activity_logs;

-- Only admins can view activity logs
CREATE POLICY "Only admins can view activity logs"
    ON public.admin_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can insert activity logs
CREATE POLICY "Only admins can insert activity logs"
    ON public.admin_activity_logs FOR INSERT
    WITH CHECK (
        auth.uid() = admin_id AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 10. NOTIFICATIONS TABLE
-- =====================================================
-- Real-time notifications for users
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lab_completed', 'new_lab', 'achievement', 'security', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index for faster queries
    CONSTRAINT notifications_type_check CHECK (type IN ('lab_completed', 'new_lab', 'achievement', 'security', 'info'))
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS (Run these in Supabase Dashboard)
-- =====================================================
-- Create storage buckets for file uploads:
-- 1. profile-avatars (public)
-- 2. bug-screenshots (private)
-- 3. blog-images (public)

-- =====================================================
-- COMPLETED SCHEMA SETUP
-- =====================================================
-- Next steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Create storage buckets in Supabase Storage
-- 3. Configure OAuth providers in Supabase Auth settings
-- 4. Update your .env file with Supabase credentials
-- =====================================================
