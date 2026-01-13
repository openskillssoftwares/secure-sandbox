#!/usr/bin/env pwsh
# Build all pentesting lab Docker images

Write-Host "🔨 Building All Pentesting Lab Docker Images..." -ForegroundColor Cyan
Write-Host ""

$labs = @(
    @{Name="sql-injection"; Tag="pentest/sql-injection:latest"},
    @{Name="xss"; Tag="pentest/xss:latest"},
    @{Name="broken-auth"; Tag="pentest/broken-auth:latest"},
    @{Name="ssrf"; Tag="pentest/ssrf:latest"},
    @{Name="broken-access"; Tag="pentest/broken-access:latest"},
    @{Name="crypto"; Tag="pentest/crypto:latest"},
    @{Name="misconfig"; Tag="pentest/misconfig:latest"},
    @{Name="network"; Tag="pentest/network:latest"},
    @{Name="design"; Tag="pentest/design:latest"},
    @{Name="bank"; Tag="pentest/bank:latest"}
)

$successful = 0
$failed = 0
$failedLabs = @()

foreach ($lab in $labs) {
    Write-Host "Building $($lab.Name)..." -ForegroundColor Yellow
    
    $labPath = Join-Path -Path "labs" -ChildPath $lab.Name
    
    if (-Not (Test-Path $labPath)) {
        Write-Host "  ❌ Directory not found: $labPath" -ForegroundColor Red
        $failed++
        $failedLabs += $lab.Name
        continue
    }
    
    Push-Location $labPath
    
    try {
        $result = docker build -t $lab.Tag . 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($lab.Name) built successfully" -ForegroundColor Green
            $successful++
        } else {
            Write-Host "  ❌ Failed to build $($lab.Name)" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            $failed++
            $failedLabs += $lab.Name
        }
    } catch {
        Write-Host "  ❌ Exception building $($lab.Name): $_" -ForegroundColor Red
        $failed++
        $failedLabs += $lab.Name
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Build Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Successful: $successful" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "Failed labs:" -ForegroundColor Red
    foreach ($lab in $failedLabs) {
        Write-Host "  - $lab" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "To list all images:" -ForegroundColor Cyan
Write-Host "  docker images | grep pentest" -ForegroundColor White
Write-Host ""
Write-Host "To test a lab:" -ForegroundColor Cyan
Write-Host "  docker run -d -p 8080:80 pentest/sql-injection:latest" -ForegroundColor White
Write-Host "  Then open http://localhost:8080 in your browser" -ForegroundColor White

if ($successful -eq $labs.Count) {
    Write-Host ""
    Write-Host "🎉 All labs built successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Some labs failed to build. Check errors above." -ForegroundColor Yellow
    exit 1
}
