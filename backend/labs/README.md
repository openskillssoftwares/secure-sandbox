# Pentesting Lab Docker Images

This directory contains 10 vulnerable web applications for pentesting practice.

## Available Labs

1. **SQL Injection** - `pentest/sql-injection:latest`
   - Flags: Easy, Medium, Hard, Impossible
   - Tech: PHP, MySQL, Nginx

2. **XSS (Cross-Site Scripting)** - `pentest/xss:latest`
   - Flags: Reflected, Stored, DOM-based, CSP bypass
   - Tech: PHP, Nginx

3. **Broken Authentication** - `pentest/broken-auth:latest`
   - Flags: Weak passwords, Session hijacking, JWT forgery, MFA bypass
   - Tech: Node.js, Express, SQLite

4. **SSRF (Server-Side Request Forgery)** - `pentest/ssrf:latest`
   - Flags: Localhost access, Filter bypass, Cloud metadata, Blind SSRF
   - Tech: Python, Flask

5. **Broken Access Control** - `pentest/broken-access:latest`
   - Flags: IDOR, Privilege escalation, Race condition, Multi-layer bypass
   - Tech: PHP, SQLite

6. **Cryptographic Failures** - `pentest/crypto:latest`
   - Flags: Base64 encoding, Weak cipher, Hash collision, Padding oracle
   - Tech: Python, Flask

7. **Security Misconfiguration** - `pentest/misconfig:latest`
   - Flags: Default credentials, Debug mode, CORS misconfiguration, Admin access
   - Tech: Nginx, Static files

8. **Port & Network Vulnerabilities** - `pentest/network:latest`
   - Flags: Port discovery, Service enumeration, Firewall bypass, Zero-day
   - Tech: Ubuntu, SSH, FTP, Apache, MySQL

9. **Insecure Design** - `pentest/design:latest`
   - Flags: Logic flaws, Client-side trust, Race condition, Business logic
   - Tech: Node.js, Express

10. **Banking System** - `pentest/bank:latest`
    - Flags: Account enumeration, Transaction manipulation, Race condition, Full takeover
    - Tech: Node.js, Express, SQLite

## Building All Images

### Windows (PowerShell)
```powershell
cd backend
.\build-labs.ps1
```

### Linux/Mac (Bash)
```bash
cd backend
chmod +x build-labs.sh
./build-labs.sh
```

### Manual Build (Individual Lab)
```bash
cd backend/labs/sql-injection
docker build -t pentest/sql-injection:latest .
```

## Running a Lab

### Quick Test
```bash
# Run SQL Injection lab
docker run -d -p 8080:80 --name sql-lab pentest/sql-injection:latest

# Open browser to http://localhost:8080
```

### Stop Lab
```bash
docker stop sql-lab
docker rm sql-lab
```

## Lab Specifications

Each lab:
- Runs on port 80 inside container
- Has 4 difficulty levels (Easy, Medium, Hard, Impossible)
- Contains hidden flags at each difficulty
- Isolated in separate Docker container
- Auto-cleans up after 12 hours (via backend service)

## Integration with Backend

The backend sandbox service automatically:
- Creates containers from these images
- Maps to available ports (8000-9000)
- Applies resource limits (512MB RAM, 50% CPU)
- Tracks user progress and flag submissions
- Cleans up old containers

## Troubleshooting

**Build fails:**
```bash
# Check Docker is running
docker --version

# Check Docker daemon
docker ps

# View build logs
docker build -t pentest/sql-injection:latest labs/sql-injection/
```

**Container won't start:**
```bash
# Check logs
docker logs <container-id>

# Check if port is already in use
netstat -an | grep 8080
```

**Out of disk space:**
```bash
# Clean up old images
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Security Notes

⚠️ **WARNING**: These images contain intentional vulnerabilities!

- **DO NOT** deploy to production
- **DO NOT** expose to public internet
- Use only in isolated lab environment
- Reset containers regularly
- Monitor resource usage

## Development

To add a new lab:

1. Create directory in `labs/`
2. Add Dockerfile
3. Create vulnerable application
4. Add to build script
5. Update database schema with lab config
6. Test locally before deploying

## Resource Requirements

- **Disk Space**: ~5GB for all images
- **RAM**: 512MB per running container
- **CPU**: 50% limit per container
- **Network**: Bridge mode, isolated

## Support

For issues or questions:
- Check backend/README.md
- View SETUP_GUIDE.md
- Check Docker logs
- Review individual lab Dockerfiles
