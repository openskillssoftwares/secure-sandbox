# Pentest Sandbox Backend - Production Ready

## 🛡️ Overview

This is the complete production backend for a pentesting learning platform with subscription-based access, isolated sandbox environments, and comprehensive security labs.

## 🚀 Features

### Authentication & Security
- JWT-based authentication with refresh tokens
- Email verification with SMTP integration
- Password reset functionality
- Secure password hashing with bcrypt
- Session management with Redis support

### Payment Integration
- Razorpay payment gateway integration
- Three subscription tiers: Free, Starter, Unlimited
- Automated payment verification
- Webhook support for payment events
- Payment history tracking

### Subscription Plans

| Plan | Price (INR) | Daily Hours | Features |
|------|-------------|-------------|----------|
| Free | ₹0 | 5 hours | Basic labs, Community support |
| Starter | ₹499/month | 7 hours | All labs, Priority support, Progress tracking |
| Unlimited | ₹999/month | Unlimited | All features, Exclusive challenges, Certificates |

### Pentesting Labs

#### Available Lab Types:
1. **SQL Injection** - Learn injection techniques across 4 difficulty levels
2. **XSS (Cross-Site Scripting)** - Master reflected, stored, and DOM-based XSS
3. **Broken Authentication** - Exploit authentication vulnerabilities
4. **SSRF (Server-Side Request Forgery)** - Access internal resources
5. **Broken Access Control** - Bypass access controls and escalate privileges
6. **Cryptographic Failures** - Exploit weak encryption
7. **Security Misconfiguration** - Find common misconfigurations
8. **Port & Network Vulnerabilities** - Network security testing
9. **Insecure Design** - Identify design flaws
10. **Banking System** - Real-world banking application vulnerabilities

#### Difficulty Levels:
- **Easy** - Basic vulnerabilities, clear exploitation paths
- **Medium** - Requires knowledge of common techniques
- **Hard** - Advanced exploitation, multiple steps
- **Impossible** - Near real-world complexity, chained attacks

### Isolated Sandbox System
- Docker-based container isolation
- Resource limits (CPU, Memory)
- Network isolation
- Auto-cleanup of old instances
- 12-hour auto-stop mechanism

### Databases
- **Secure Database** (PostgreSQL) - User data, payments, sessions
- **Vulnerable Database** (PostgreSQL) - Practice database with intentional vulnerabilities

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Docker Desktop (for sandbox containers)
- Redis (optional, for enhanced session management)

## 🔧 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Create two PostgreSQL databases:

```bash
# Secure database
createdb secure_pentest_db

# Vulnerable database (on different port or instance)
createdb vulnerable_practice_db
```

Run the schemas:

```bash
psql -d secure_pentest_db -f database/schema-secure.sql
psql -d vulnerable_practice_db -f database/schema-vulnerable.sql
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database Configuration (Secure)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_pentest_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Vulnerable Database Configuration
VULN_DB_HOST=localhost
VULN_DB_PORT=5433
VULN_DB_NAME=vulnerable_practice_db
VULN_DB_USER=vuln_user
VULN_DB_PASSWORD=vuln_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@pentestsandbox.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock
SANDBOX_NETWORK=pentest_sandbox_network

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com
```

### 4. Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASSWORD`

### 5. Razorpay Setup

1. Sign up at [Razorpay](https://razorpay.com)
2. Get API Keys from Dashboard → Settings → API Keys
3. Add keys to `.env` file
4. Set up webhooks for payment events

### 6. Docker Setup

Ensure Docker Desktop is running:

```bash
docker --version
docker ps
```

Pull base images (optional, will be pulled automatically):

```bash
docker pull ubuntu:22.04
docker pull nginx:alpine
```

### 7. Build and Run

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/change-password` - Change password
- `POST /api/user/change-email` - Change email
- `GET /api/user/progress` - Get learning progress
- `GET /api/user/usage-logs` - Get usage history
- `GET /api/user/usage-status` - Check daily usage limit
- `DELETE /api/user/account` - Delete account

### Payment
- `GET /api/payment/plans` - Get pricing plans
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment
- `POST /api/payment/webhook` - Razorpay webhook
- `GET /api/payment/history` - Payment history
- `POST /api/payment/cancel-subscription` - Cancel subscription

### Sandbox Management
- `POST /api/sandbox/start` - Start new sandbox
- `POST /api/sandbox/stop/:sandboxId` - Stop sandbox
- `GET /api/sandbox/active` - Get active sandboxes
- `GET /api/sandbox/:sandboxId` - Get sandbox details
- `POST /api/sandbox/restart/:sandboxId` - Restart sandbox
- `POST /api/sandbox/submit-flag/:sandboxId` - Submit flag

### Labs
- `GET /api/labs` - Get all labs
- `GET /api/labs/:labType` - Get lab details
- `GET /api/labs/categories/list` - Get categories
- `GET /api/labs/leaderboard/global` - Global leaderboard
- `GET /api/labs/leaderboard/rank` - User rank
- `GET /api/labs/stats/overview` - Lab statistics

### Admin (Requires Admin Access)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/sandboxes` - List all sandboxes
- `POST /api/admin/sandboxes/:sandboxId/stop` - Force stop sandbox
- `POST /api/admin/labs` - Create new lab
- `PUT /api/admin/labs/:labId` - Update lab
- `POST /api/admin/maintenance/cleanup` - Cleanup old sandboxes
- `GET /api/admin/system/health` - System health

## 🐳 Docker Lab Images

Create Docker images for each lab type. Example Dockerfile for SQL Injection lab:

```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    php-fpm \
    php-mysqli \
    mysql-server \
    && rm -rf /var/lib/apt/lists/*

# Copy vulnerable application
COPY lab-files/ /var/www/html/

# Configure MySQL with vulnerable database
COPY vulnerable-db.sql /docker-entrypoint-initdb.d/

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build images:

```bash
docker build -t pentest/sql-injection:latest ./labs/sql-injection
docker build -t pentest/xss:latest ./labs/xss
# ... build other labs
```

## 🔒 Security Considerations

### Production Deployment

1. **Environment Variables**
   - Never commit `.env` file
   - Use environment-specific configurations
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Separate vulnerable DB from secure DB

3. **API Security**
   - Rate limiting enabled
   - CORS configured
   - Helmet.js for headers
   - Input validation

4. **Docker Security**
   - Resource limits enforced
   - Network isolation
   - Auto-cleanup mechanism
   - Regular image updates

5. **Email Security**
   - Use app-specific passwords
   - Enable TLS
   - Verify sender domain

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Database Connection

The server automatically checks database connections on startup.

### Docker Status

Check running containers:

```bash
docker ps --filter label=pentest.user
```

## 🧪 Testing

Run tests (when implemented):

```bash
npm test
```

## 🚀 Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name pentest-backend
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t pentest-backend .
docker run -d -p 5000:5000 --name pentest-backend pentest-backend
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 License

MIT License

## 🤝 Support

For issues and support, please contact support@pentestsandbox.com

---

**Note**: This platform is for educational purposes only. Always practice responsible disclosure and ethical hacking.
