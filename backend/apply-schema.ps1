# Phase 1 Database Setup Script
# This script applies the Phase 1 schema enhancements

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║   Phase 1 Database Setup                                      ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Write-Host "✓ Loading environment variables..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    exit 1
}

$DB_HOST = $env:DB_SECURE_HOST
$DB_PORT = $env:DB_SECURE_PORT
$DB_NAME = $env:DB_SECURE_NAME
$DB_USER = $env:DB_SECURE_USER
$DB_PASSWORD = $env:DB_SECURE_PASSWORD

Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host "  User: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✓ psql found" -ForegroundColor Green
} catch {
    Write-Host "✗ psql not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL or add it to your PATH:" -ForegroundColor Yellow
    Write-Host "  C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can also apply the schema manually using pgAdmin:" -ForegroundColor Yellow
    Write-Host "  Open: backend\database\schema-phase1-enhancements.sql" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Check if schema file exists
if (-not (Test-Path "database\schema-phase1-enhancements.sql")) {
    Write-Host "✗ Schema file not found: database\schema-phase1-enhancements.sql" -ForegroundColor Red
    exit 1
}

Write-Host "Applying schema enhancements..." -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Apply schema
try {
    $output = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "database\schema-phase1-enhancements.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                               ║" -ForegroundColor Green
        Write-Host "║   ✓ Database schema applied successfully!                    ║" -ForegroundColor Green
        Write-Host "║                                                               ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Tables created:" -ForegroundColor Cyan
        Write-Host "  • oauth_providers" -ForegroundColor Gray
        Write-Host "  • user_profiles" -ForegroundColor Gray
        Write-Host "  • bug_reports" -ForegroundColor Gray
        Write-Host "  • blogs" -ForegroundColor Gray
        Write-Host "  • user_roles" -ForegroundColor Gray
        Write-Host "  • admin_activity_logs" -ForegroundColor Gray
        Write-Host "  • leaderboard_cache" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Configure OAuth credentials in .env" -ForegroundColor Gray
        Write-Host "  2. Start the server: npm run dev" -ForegroundColor Gray
        Write-Host "  3. Test endpoints (see PHASE1_SETUP.md)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Error applying schema" -ForegroundColor Red
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Yellow
        Write-Host $output
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  • Database doesn't exist: Create it first" -ForegroundColor Gray
        Write-Host "  • Wrong credentials: Check .env file" -ForegroundColor Gray
        Write-Host "  • Tables already exist: Schema already applied" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
