-- Secure User Database Schema
-- This database handles all user authentication and sensitive data

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, starter, unlimited
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    daily_usage_hours DECIMAL(5,2) DEFAULT 0,
    last_usage_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    plan_type VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sandbox Instances Table
CREATE TABLE IF NOT EXISTS sandbox_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    container_id VARCHAR(255) UNIQUE,
    lab_type VARCHAR(100) NOT NULL, -- sql_injection, xss, ssrf, etc.
    difficulty_level VARCHAR(20) NOT NULL, -- easy, medium, hard, impossible
    port INT,
    status VARCHAR(50) DEFAULT 'running', -- running, stopped, error
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_stop_time TIMESTAMP
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_type VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    flags_captured JSONB DEFAULT '[]',
    score INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    attempts INT DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lab_type, difficulty_level)
);

-- Usage Logs Table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_type VARCHAR(100),
    action VARCHAR(100) NOT NULL, -- login, lab_start, lab_stop, etc.
    duration_seconds INT,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Configurations Table
CREATE TABLE IF NOT EXISTS lab_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_type VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_levels JSONB NOT NULL, -- ["easy", "medium", "hard", "impossible"]
    docker_image VARCHAR(255) NOT NULL,
    flags JSONB NOT NULL, -- Flags for each difficulty level
    hints JSONB,
    points_per_level JSONB, -- {"easy": 100, "medium": 200, ...}
    estimated_time_minutes INT,
    prerequisites JSONB,
    tags JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Verification Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL, -- verification, password_reset, notification
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'sent', -- sent, failed, pending
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_plan, subscription_status);
CREATE INDEX idx_payment_history_user ON payment_history(user_id);
CREATE INDEX idx_sandbox_instances_user ON sandbox_instances(user_id);
CREATE INDEX idx_sandbox_instances_status ON sandbox_instances(status);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at);

-- Insert default lab configurations
INSERT INTO lab_configurations (lab_type, name, description, difficulty_levels, docker_image, flags, points_per_level, estimated_time_minutes, tags) VALUES
('sql_injection', 'SQL Injection Lab', 'Learn and practice SQL injection techniques on vulnerable databases', '["easy", "medium", "hard", "impossible"]', 'pentest/sql-injection:latest', 
'{"easy": "FLAG{sql_1nj3ct10n_b4s1c}", "medium": "FLAG{bl1nd_sql_m4st3r}", "hard": "FLAG{t1m3_b4s3d_sql_n1nj4}", "impossible": "FLAG{s3c0nd_0rd3r_sql_g0d}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 45, '["sql", "injection", "database"]'),

('xss', 'Cross-Site Scripting Lab', 'Master XSS attacks including reflected, stored, and DOM-based XSS', '["easy", "medium", "hard", "impossible"]', 'pentest/xss:latest',
'{"easy": "FLAG{xss_r3fl3ct3d_b4s1c}", "medium": "FLAG{st0r3d_xss_pwn3d}", "hard": "FLAG{d0m_b4s3d_xss_m4st3r}", "impossible": "FLAG{csp_byp4ss_l3g3nd}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 40, '["xss", "javascript", "web"]'),

('broken_auth', 'Broken Authentication Lab', 'Exploit authentication vulnerabilities and session management flaws', '["easy", "medium", "hard", "impossible"]', 'pentest/broken-auth:latest',
'{"easy": "FLAG{w34k_p4ssw0rd_cr4ck3d}", "medium": "FLAG{s3ss10n_h1j4ck3d}", "hard": "FLAG{jwt_f0rg3ry_m4st3r}", "impossible": "FLAG{mult1_f4ct0r_byp4ss}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 50, '["authentication", "session", "security"]'),

('ssrf', 'Server-Side Request Forgery Lab', 'Discover and exploit SSRF vulnerabilities to access internal resources', '["easy", "medium", "hard", "impossible"]', 'pentest/ssrf:latest',
'{"easy": "FLAG{ssrf_l0c4lh0st_p1ng}", "medium": "FLAG{1nt3rn4l_n3tw0rk_sc4n}", "hard": "FLAG{cl0ud_m3t4d4t4_l34k}", "impossible": "FLAG{bl1nd_ssrf_ch41n}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 55, '["ssrf", "network", "cloud"]'),

('broken_access', 'Broken Access Control Lab', 'Bypass access controls and escalate privileges', '["easy", "medium", "hard", "impossible"]', 'pentest/broken-access:latest',
'{"easy": "FLAG{1d0r_vuln3r4b1l1ty}", "medium": "FLAG{pr1v_3sc4l4t10n}", "hard": "FLAG{r4c3_c0nd1t10n_4cc3ss}", "impossible": "FLAG{mult1_l4y3r_byp4ss}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 45, '["authorization", "access-control", "privilege-escalation"]'),

('crypto_failures', 'Cryptographic Failures Lab', 'Exploit weak encryption and sensitive data exposure', '["easy", "medium", "hard", "impossible"]', 'pentest/crypto:latest',
'{"easy": "FLAG{b4s3_64_3nc0d1ng}", "medium": "FLAG{w34k_c1ph3r_cr4ck3d}", "hard": "FLAG{h4sh_c0ll1s10n_f0und}", "impossible": "FLAG{qu4ntum_r3s1st4nt_br0k3n}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 60, '["encryption", "crypto", "data-protection"]'),

('security_misconfig', 'Security Misconfiguration Lab', 'Find and exploit common security misconfigurations', '["easy", "medium", "hard", "impossible"]', 'pentest/misconfig:latest',
'{"easy": "FLAG{d3f4ult_cr3d3nt14ls}", "medium": "FLAG{d3bug_m0d3_3n4bl3d}", "hard": "FLAG{c0rs_byp4ss_ch41n}", "impossible": "FLAG{mult1_s3rv1c3_ch41n}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 40, '["configuration", "security", "hardening"]'),

('port_vuln', 'Port & Network Vulnerability Lab', 'Scan, enumerate, and exploit network services', '["easy", "medium", "hard", "impossible"]', 'pentest/network:latest',
'{"easy": "FLAG{0p3n_p0rt_d1sc0v3ry}", "medium": "FLAG{s3rv1c3_3num3r4t10n}", "hard": "FLAG{f1r3w4ll_byp4ss}", "impossible": "FLAG{z3r0_d4y_3xpl01t}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 70, '["network", "ports", "services"]'),

('insecure_design', 'Insecure Design Lab', 'Identify and exploit fundamental design flaws', '["easy", "medium", "hard", "impossible"]', 'pentest/design:latest',
'{"easy": "FLAG{l0g1c_fl4w_f0und}", "medium": "FLAG{bus1n3ss_l0g1c_byp4ss}", "hard": "FLAG{r4c3_c0nd1t10n_3xpl01t}", "impossible": "FLAG{arch1t3ctur3_c0mpr0m1s3}"}',
'{"easy": 100, "medium": 250, "hard": 500, "impossible": 1000}', 65, '["design", "architecture", "logic"]'),

('bank_system', 'Banking System Vulnerability Lab', 'Hack into a simulated banking system and find vulnerabilities', '["easy", "medium", "hard", "impossible"]', 'pentest/bank:latest',
'{"easy": "FLAG{4cc0unt_3num3r4t10n}", "medium": "FLAG{tr4ns4ct10n_m4n1pul4t10n}", "hard": "FLAG{r4c3_c0nd1t10n_tr4nsf3r}", "impossible": "FLAG{full_b4nk_t4k30v3r}"}',
'{"easy": 150, "medium": 350, "hard": 700, "impossible": 1500}', 90, '["banking", "finance", "real-world"]');
