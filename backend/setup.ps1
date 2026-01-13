# Secure Pentest Sandbox - Automated Setup Script
# Run this script to set up the backend infrastructure

Write-Host "🛡️  Secure Pentest Sandbox - Backend Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL 14+ from https://www.postgresql.org" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not found. Docker is optional but recommended for sandbox labs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Database setup
Write-Host "🗄️  Database Setup" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host ""

$createDatabases = Read-Host "Do you want to create databases now? (y/n)"

if ($createDatabases -eq 'y') {
    Write-Host "Creating databases..." -ForegroundColor Yellow
    
    # Create secure database
    createdb secure_pentest_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secure database created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Secure database might already exist" -ForegroundColor Yellow
    }
    
    # Create vulnerable database
    createdb vulnerable_practice_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vulnerable database created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Vulnerable database might already exist" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Running database schemas..." -ForegroundColor Yellow
    
    # Run schemas
    psql -d secure_pentest_db -f database/schema-secure.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secure database schema created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create secure database schema" -ForegroundColor Red
    }
    
    psql -d vulnerable_practice_db -f database/schema-vulnerable.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vulnerable database schema created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create vulnerable database schema" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "⚙️  Environment Configuration" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit backend/.env with your configuration:" -ForegroundColor Yellow
    Write-Host "   - Database passwords" -ForegroundColor White
    Write-Host "   - JWT secrets (generate random strings)" -ForegroundColor White
    Write-Host "   - Gmail SMTP credentials (app password)" -ForegroundColor White
    Write-Host "   - Razorpay API keys" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Cyan
}

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Build completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit backend/.env with your configuration" -ForegroundColor White
Write-Host "   2. Set up Gmail App Password: https://myaccount.google.com/apppasswords" -ForegroundColor White
Write-Host "   3. Get Razorpay API keys: https://razorpay.com" -ForegroundColor White
Write-Host "   4. Start the backend: npm run dev" -ForegroundColor White
Write-Host "   5. In another terminal, start frontend: cd .. && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed setup instructions, see SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

$startNow = Read-Host "Do you want to start the development server now? (y/n)"

if ($startNow -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting backend server..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}
