# 🚀 Quick Reference Card

## Essential Commands

### Start Development
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
npm run dev
```

### Database Setup
```bash
# Create databases
createdb secure_pentest_db
createdb vulnerable_practice_db

# Run schemas
psql -d secure_pentest_db -f backend/database/schema-secure.sql
psql -d vulnerable_practice_db -f backend/database/schema-vulnerable.sql
```

### Build for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

## Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_NAME=secure_pentest_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Email
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

## Key URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Common Issues

### Backend won't start
```bash
# Check PostgreSQL
psql -U postgres -l

# Check port 5000
netstat -an | findstr "5000"
```

### Email not sending
- Use Gmail App Password (not regular password)
- Enable 2FA first: https://myaccount.google.com/apppasswords

### Database connection error
```bash
# Test connection
psql -h localhost -U postgres -d secure_pentest_db
```

## Razorpay Test Cards

```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

## Subscription Plans

| Plan | Price | Daily Hours |
|------|-------|-------------|
| Free | ₹0 | 5 hours |
| Starter | ₹499 | 7 hours |
| Unlimited | ₹999 | ∞ unlimited |

## Available Labs

1. SQL Injection
2. XSS (Cross-Site Scripting)
3. Broken Authentication
4. SSRF
5. Broken Access Control
6. Cryptographic Failures
7. Security Misconfiguration
8. Port Vulnerabilities
9. Insecure Design
10. Banking System

Each with 4 difficulty levels: Easy, Medium, Hard, Impossible

## API Quick Test

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

## Docker Commands

```bash
# Check Docker
docker ps

# Build lab image
docker build -t pentest/sql-injection:latest ./backend/labs/sql-injection

# List pentest containers
docker ps --filter label=pentest.user

# Stop all pentest containers
docker stop $(docker ps -q --filter label=pentest.user)
```

## Useful Queries

```sql
-- Check users
SELECT email, username, subscription_plan FROM users;

-- Check active sandboxes
SELECT user_id, lab_type, status FROM sandbox_instances WHERE status='running';

-- Check payments
SELECT user_id, amount, plan_type, payment_status FROM payment_history;

-- User progress
SELECT lab_type, difficulty_level, completed, score FROM user_progress WHERE user_id='xxx';
```

## Port Usage

- 5173 - Frontend (Vite)
- 5000 - Backend API
- 5432 - Secure PostgreSQL
- 5433 - Vulnerable PostgreSQL (optional)
- 6379 - Redis (optional)
- 8000-9000 - Sandbox containers

## File Locations

- Backend code: `backend/src/`
- Frontend code: `src/`
- Database schemas: `backend/database/`
- Lab Dockerfiles: `backend/labs/`
- API client: `src/lib/api.ts`
- Auth context: `src/contexts/AuthContext.tsx`

## Support

📚 Full docs: `SETUP_GUIDE.md`
📝 Implementation: `IMPLEMENTATION_COMPLETE.md`
🔧 Backend docs: `backend/README.md`

## Quick Tips

1. Always start backend before frontend
2. Check logs for errors: `console.log` in code
3. Use browser DevTools Network tab to debug API calls
4. Test with Razorpay test mode first
5. Gmail app password ≠ regular password
6. JWT tokens expire in 1 hour (access) / 7 days (refresh)
7. Daily usage resets after 24 hours
8. Sandboxes auto-stop after 12 hours
