-- Phase 1 Enhancement: Additional Tables for OAuth, Profile Pictures, and Bug Reports

-- OAuth Providers Table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, github
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

-- User Profiles Table (Extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    profile_picture VARCHAR(500),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(500),
    github_url VARCHAR(500),
    twitter_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    total_score INT DEFAULT 0,
    rank INT,
    labs_completed INT DEFAULT 0,
    total_time_spent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bug Reports Table
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    lab_type VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    browser VARCHAR(100),
    os VARCHAR(100),
    screenshot_url VARCHAR(500),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    tags VARCHAR(255)[],
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    views INT DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Table (for admin/writer roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- admin, writer, moderator
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100), -- user, lab, blog, payment, etc.
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard Cache Table
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    username VARCHAR(100),
    total_score INT DEFAULT 0,
    labs_completed INT DEFAULT 0,
    rank INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON oauth_providers(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_rank ON leaderboard_cache(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_score ON leaderboard_cache(total_score DESC);

-- Add role column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- Create view for user rankings
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    u.id,
    u.username,
    u.email,
    up.profile_picture,
    up.total_score,
    up.labs_completed,
    up.total_time_spent,
    RANK() OVER (ORDER BY up.total_score DESC, up.labs_completed DESC) as rank
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.role != 'admin'
ORDER BY up.total_score DESC;

-- Function to update leaderboard cache
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard_cache (user_id, username, total_score, labs_completed, rank, last_updated)
    SELECT 
        id,
        username,
        COALESCE((SELECT total_score FROM user_profiles WHERE user_id = users.id), 0),
        COALESCE((SELECT labs_completed FROM user_profiles WHERE user_id = users.id), 0),
        RANK() OVER (ORDER BY COALESCE((SELECT total_score FROM user_profiles WHERE user_id = users.id), 0) DESC),
        CURRENT_TIMESTAMP
    FROM users
    WHERE id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        total_score = EXCLUDED.total_score,
        labs_completed = EXCLUDED.labs_completed,
        rank = EXCLUDED.rank,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when user_profiles changes
CREATE TRIGGER trigger_update_leaderboard_cache
AFTER INSERT OR UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_leaderboard_cache();
