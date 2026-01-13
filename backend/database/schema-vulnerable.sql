-- Vulnerable Practice Database Schema
-- This database is intentionally vulnerable for practice purposes
-- Security levels vary based on difficulty (easy, medium, hard, impossible)

-- ============================================
-- EASY LEVEL DATABASE (Obvious Vulnerabilities)
-- ============================================

-- Vulnerable Users Table (Easy)
CREATE TABLE IF NOT EXISTS vuln_users_easy (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL, -- Plain text passwords!
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    balance DECIMAL(10,2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert vulnerable test data
INSERT INTO vuln_users_easy (username, password, email, role, balance) VALUES
('admin', 'admin123', 'admin@example.com', 'admin', 50000.00),
('john_doe', 'password', 'john@example.com', 'user', 1500.00),
('jane_smith', '123456', 'jane@example.com', 'user', 2300.00),
('guest', 'guest', 'guest@example.com', 'guest', 100.00);

-- Vulnerable Products Table (Easy)
CREATE TABLE IF NOT EXISTS products_easy (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    hidden BOOLEAN DEFAULT FALSE
);

INSERT INTO products_easy (name, description, price, stock, hidden) VALUES
('Laptop', 'High-performance laptop', 999.99, 50, FALSE),
('Phone', 'Latest smartphone', 699.99, 100, FALSE),
('Secret Document', 'FLAG{sql_1nj3ct10n_b4s1c}', 0.00, 1, TRUE),
('Tablet', 'Portable tablet device', 399.99, 75, FALSE);

-- Vulnerable Comments Table (Easy - XSS)
CREATE TABLE IF NOT EXISTS comments_easy (
    id SERIAL PRIMARY KEY,
    user_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO comments_easy (user_id, content) VALUES
(1, 'This is a normal comment'),
(2, '<script>alert("XSS")</script>'),
(3, 'Great product!');

-- ============================================
-- MEDIUM LEVEL DATABASE (Moderate Security)
-- ============================================

-- Vulnerable Users Table (Medium - Weak Hashing)
CREATE TABLE IF NOT EXISTS vuln_users_medium (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- MD5 hashed
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    balance DECIMAL(10,2) DEFAULT 1000.00,
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MD5 hashes (easily crackable)
INSERT INTO vuln_users_medium (username, password_hash, email, role, balance) VALUES
('admin', '5f4dcc3b5aa765d61d8327deb882cf99', 'admin@bank.com', 'admin', 100000.00), -- password
('user1', '5f4dcc3b5aa765d61d8327deb882cf99', 'user1@bank.com', 'user', 5000.00), -- password
('moderator', 'e10adc3949ba59abbe56e057f20f883e', 'mod@bank.com', 'moderator', 25000.00); -- 123456

-- Bank Transactions Table (Medium)
CREATE TABLE IF NOT EXISTS transactions_medium (
    id SERIAL PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    flag VARCHAR(255)
);

INSERT INTO transactions_medium (from_user_id, to_user_id, amount, status, flag) VALUES
(1, 2, 1000.00, 'completed', NULL),
(2, 3, 500.00, 'completed', NULL),
(1, 1, 0.00, 'hidden', 'FLAG{bl1nd_sql_m4st3r}');

-- System Config Table (Medium)
CREATE TABLE IF NOT EXISTS system_config_medium (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE
);

INSERT INTO system_config_medium (config_key, config_value, is_sensitive) VALUES
('api_endpoint', 'https://api.example.com', FALSE),
('admin_email', 'admin@system.local', FALSE),
('secret_key', 'FLAG{w34k_c1ph3r_cr4ck3d}', TRUE),
('debug_mode', 'enabled', FALSE);

-- ============================================
-- HARD LEVEL DATABASE (Advanced Vulnerabilities)
-- ============================================

-- Vulnerable Users Table (Hard - Better but still vulnerable)
CREATE TABLE IF NOT EXISTS vuln_users_hard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- SHA256 but no salt
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    balance DECIMAL(10,2) DEFAULT 1000.00,
    otp_secret VARCHAR(255), -- Predictable OTP
    jwt_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts Table (Hard)
CREATE TABLE IF NOT EXISTS bank_accounts_hard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES vuln_users_hard(id),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(50),
    balance DECIMAL(15,2) DEFAULT 0.00,
    interest_rate DECIMAL(5,2),
    is_locked BOOLEAN DEFAULT FALSE,
    lock_reason TEXT
);

-- Advanced Transactions (Hard - Race Condition Vulnerable)
CREATE TABLE IF NOT EXISTS transactions_hard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account VARCHAR(20) NOT NULL,
    to_account VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Audit Logs (Hard)
CREATE TABLE IF NOT EXISTS audit_logs_hard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    flag VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audit_logs_hard (user_id, action, table_name, flag) VALUES
(NULL, 'system_backup', 'all', 'FLAG{t1m3_b4s3d_sql_n1nj4}');

-- ============================================
-- IMPOSSIBLE LEVEL DATABASE (Near Real-World)
-- ============================================

-- Highly Protected Users (Impossible - Advanced Techniques Required)
CREATE TABLE IF NOT EXISTS vuln_users_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt but with timing attack
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    mfa_enabled BOOLEAN DEFAULT TRUE,
    mfa_secret VARCHAR(255),
    backup_codes JSONB,
    security_questions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise Bank Accounts (Impossible)
CREATE TABLE IF NOT EXISTS enterprise_accounts_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES vuln_users_impossible(id),
    account_number VARCHAR(30) UNIQUE NOT NULL,
    account_type VARCHAR(50),
    balance DECIMAL(20,2) DEFAULT 0.00,
    daily_limit DECIMAL(15,2),
    monthly_limit DECIMAL(15,2),
    requires_approval BOOLEAN DEFAULT TRUE,
    approval_threshold DECIMAL(15,2),
    encryption_key VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complex Transactions (Impossible - Multiple Validation Layers)
CREATE TABLE IF NOT EXISTS complex_transactions_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    from_account_id UUID,
    to_account_id UUID,
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    transaction_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending_verification',
    requires_mfa BOOLEAN DEFAULT TRUE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50),
    approved_by UUID,
    encryption_nonce VARCHAR(255),
    signature VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Hidden Admin Table (Impossible)
CREATE TABLE IF NOT EXISTS hidden_admin_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_level INT DEFAULT 10,
    special_privileges JSONB,
    master_key VARCHAR(500),
    flag VARCHAR(255),
    last_accessed TIMESTAMP
);

INSERT INTO hidden_admin_impossible (access_level, special_privileges, master_key, flag) VALUES
(100, '{"god_mode": true, "bypass_all": true}', 'MASTER_KEY_ENCRYPTED', 'FLAG{s3c0nd_0rd3r_sql_g0d}');

-- Second Order SQL Injection Table
CREATE TABLE IF NOT EXISTS stored_queries_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    query_name VARCHAR(255),
    stored_procedure TEXT, -- Vulnerable to second-order injection
    parameters JSONB,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys Table (Impossible - For SSRF and privilege escalation)
CREATE TABLE IF NOT EXISTS api_keys_impossible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    key_name VARCHAR(255),
    api_key VARCHAR(500) UNIQUE NOT NULL,
    permissions JSONB,
    rate_limit INT DEFAULT 100,
    internal_only BOOLEAN DEFAULT FALSE,
    can_access_admin BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_vuln_users_easy_username ON vuln_users_easy(username);
CREATE INDEX idx_vuln_users_medium_username ON vuln_users_medium(username);
CREATE INDEX idx_vuln_users_hard_username ON vuln_users_hard(username);
CREATE INDEX idx_transactions_medium_user ON transactions_medium(from_user_id, to_user_id);
CREATE INDEX idx_bank_accounts_hard_user ON bank_accounts_hard(user_id);
CREATE INDEX idx_enterprise_accounts_user ON enterprise_accounts_impossible(user_id);
