# 🛡️ Secure Pentest Sandbox - Complete Setup Guide

## 📖 Project Overview

A production-ready pentesting learning platform with:
- **Subscription-based access** (Razorpay integration)
- **Isolated Docker sandboxes** for safe practice
- **10+ vulnerability labs** (SQL Injection, XSS, SSRF, etc.)
- **4 difficulty levels** per lab (Easy, Medium, Hard, Impossible)
- **Email verification** with SMTP
- **JWT authentication** with refresh tokens
- **Two databases**: Secure (user data) + Vulnerable (practice)
- **User dashboard** for progress tracking
- **Payment management** and subscription handling

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** >= 18.x
2. **PostgreSQL** >= 14.x
3. **Docker Desktop** (for sandbox containers)
4. **Gmail Account** (for SMTP emails)
5. **Razorpay Account** (for payments)

### Installation Steps

#### 1. Clone and Install

```bash
cd d:\pentest\secure-sandbox

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

#### 2. Database Setup

```powershell
# Create databases
createdb secure_pentest_db
createdb vulnerable_practice_db

# Run schemas
psql -d secure_pentest_db -f backend/database/schema-secure.sql
psql -d vulnerable_practice_db -f backend/database/schema-vulnerable.sql
```

#### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_pentest_db
DB_USER=postgres
DB_PASSWORD=your_password

VULN_DB_HOST=localhost
VULN_DB_PORT=5432
VULN_DB_NAME=vulnerable_practice_db
VULN_DB_USER=postgres
VULN_DB_PASSWORD=your_password

# JWT Secrets (Generate random strings)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@pentestsandbox.com

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### 4. Configure Frontend

```bash
cd ..
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

#### 5. Gmail App Password Setup

1. Enable 2FA on your Gmail
2. Go to: https://myaccount.google.com/apppasswords
3. Generate password for "Mail"
4. Use this in `SMTP_PASSWORD`

#### 6. Razorpay Setup

1. Sign up at https://razorpay.com
2. Go to Settings → API Keys
3. Copy Key ID and Secret
4. Add to `.env` files

#### 7. Build Docker Lab Images (Optional)

```bash
cd backend/labs

# Build SQL Injection Lab
docker build -t pentest/sql-injection:latest ./sql-injection

# Build XSS Lab
docker build -t pentest/xss:latest ./xss
```

#### 8. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

---

## 📋 Complete Feature List

### Authentication & User Management
✅ User registration with email verification
✅ JWT-based authentication with refresh tokens
✅ Password reset via email
✅ Email change with verification
✅ Password change
✅ Account deletion
✅ Session management

### Subscription & Payments
✅ 3 subscription tiers (Free, Starter, Unlimited)
✅ Razorpay payment gateway integration
✅ Payment verification and webhook handling
✅ Payment history tracking
✅ Subscription cancellation
✅ Daily usage limits per plan

### Pentesting Labs
✅ SQL Injection lab (4 difficulty levels)
✅ XSS (Cross-Site Scripting) lab
✅ Broken Authentication lab
✅ SSRF (Server-Side Request Forgery) lab
✅ Broken Access Control lab
✅ Cryptographic Failures lab
✅ Security Misconfiguration lab
✅ Port & Network Vulnerabilities lab
✅ Insecure Design lab
✅ Banking System lab

### Sandbox System
✅ Docker-based isolated containers
✅ Resource limits (CPU, Memory)
✅ Network isolation
✅ Auto-stop mechanism (12 hours)
✅ Container restart capability
✅ Flag submission system
✅ Progress tracking

### Admin Features
✅ Dashboard with statistics
✅ User management
✅ Sandbox monitoring
✅ Lab configuration management
✅ System health monitoring
✅ Maintenance tools

---

## 🎯 API Endpoints Reference

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
GET    /api/auth/verify-email/:token - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/refresh-token     - Refresh access token
GET    /api/auth/me                - Get current user
```

### User
```
GET    /api/user/profile           - Get profile
PUT    /api/user/profile           - Update profile
POST   /api/user/change-password   - Change password
POST   /api/user/change-email      - Change email
GET    /api/user/progress          - Get progress
GET    /api/user/usage-logs        - Get usage history
GET    /api/user/usage-status      - Check daily limit
DELETE /api/user/account           - Delete account
```

### Payment
```
GET    /api/payment/plans          - Get pricing plans
POST   /api/payment/create-order   - Create order
POST   /api/payment/verify-payment - Verify payment
POST   /api/payment/webhook        - Razorpay webhook
GET    /api/payment/history        - Payment history
POST   /api/payment/cancel-subscription - Cancel plan
```

### Sandbox
```
POST   /api/sandbox/start          - Start sandbox
POST   /api/sandbox/stop/:id       - Stop sandbox
GET    /api/sandbox/active         - Get active sandboxes
GET    /api/sandbox/:id            - Get details
POST   /api/sandbox/restart/:id    - Restart sandbox
POST   /api/sandbox/submit-flag/:id - Submit flag
```

### Labs
```
GET    /api/labs                   - Get all labs
GET    /api/labs/:labType          - Get lab details
GET    /api/labs/categories/list   - Get categories
GET    /api/labs/leaderboard/global - Leaderboard
GET    /api/labs/leaderboard/rank  - User rank
GET    /api/labs/stats/overview    - Statistics
```

---

## 💳 Subscription Plans

| Feature | Free | Starter (₹499/mo) | Unlimited (₹999/mo) |
|---------|------|-------------------|---------------------|
| Daily Hours | 5h | 7h | ♾️ Unlimited |
| All Labs | ✅ | ✅ | ✅ |
| Progress Tracking | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Exclusive Challenges | ❌ | ❌ | ✅ |
| Certificates | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Check Docker
docker ps

# Check ports
netstat -an | findstr "5000"
```

### Database connection failed
```bash
# Test connection
psql -h localhost -U postgres -d secure_pentest_db

# Check pg_hba.conf for authentication settings
```

### Email not sending
- Verify Gmail app password
- Check SMTP settings
- Enable "Less secure app access" if needed
- Check firewall on port 587

### Docker sandbox won't start
```bash
# Check Docker daemon
docker info

# Check available ports
netstat -an | findstr "8000:9000"

# Check Docker images
docker images | findstr "pentest"
```

---

## 🔒 Security Notes

### Production Deployment

1. **Change all secrets** in `.env`
2. **Use HTTPS** for all connections
3. **Enable SSL** for PostgreSQL
4. **Set up firewall** rules
5. **Regular backups** of secure database
6. **Monitor logs** for suspicious activity
7. **Keep Docker images** updated

### Vulnerable Database

⚠️ **WARNING**: The vulnerable database is intentionally insecure!
- Never expose to the internet
- Keep on isolated network
- Only for educational purposes
- Regular cleanup of practice data

---

## 📊 Project Structure

```
secure-sandbox/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── sandbox.routes.ts
│   │   │   ├── lab.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── sandbox.service.ts
│   │   └── server.ts
│   ├── database/
│   │   ├── schema-secure.sql
│   │   └── schema-vulnerable.sql
│   ├── labs/
│   │   ├── sql-injection/
│   │   ├── xss/
│   │   └── ... (other labs)
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── pages/
│   └── App.tsx
├── package.json
└── README.md
```

---

## 🤝 Support

For issues:
1. Check this README
2. Review backend logs
3. Check browser console
4. Verify environment variables

---

## 📝 License

MIT License - Educational purposes only

**⚠️ Legal Disclaimer**: This platform is for educational purposes only. Always practice ethical hacking and responsible disclosure. Never use these techniques on systems you don't own or have explicit permission to test.

---

## 🎓 Learning Path

1. **Start with Easy labs** to understand basics
2. **Progress to Medium** for common vulnerabilities
3. **Tackle Hard challenges** for advanced techniques
4. **Attempt Impossible** for real-world complexity

Happy Hacking! 🚀🔐
