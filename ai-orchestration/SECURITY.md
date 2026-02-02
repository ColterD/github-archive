# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 4.x     | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the AI_Orchestration (Mimir) project, please send an email to the project maintainers. All security vulnerabilities will be promptly addressed.

**Please do not disclose security vulnerabilities publicly until a fix has been released.**

When reporting, please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Best Practices for Deployment

### 1. Change Default Passwords

**Critical:** Never use default passwords in production.

```bash
# Generate secure passwords
NEO4J_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Update your .env file
echo "NEO4J_PASSWORD=$NEO4J_PASSWORD" >> .env
echo "GRAFANA_PASSWORD=$GRAFANA_PASSWORD" >> .env
```

### 2. Network Security

**Restrict Access:**
- Bind services to localhost in production: `127.0.0.1:7474` instead of `0.0.0.0:7474`
- Use firewall rules to limit access
- Consider VPN for remote access

**Docker Networks:**
```yaml
# Use internal networks for backend services
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

### 3. Enable HTTPS/TLS

For production deployments:
- Use reverse proxy (nginx, Traefik) with SSL/TLS certificates
- Enable Neo4j encrypted bolt protocol (`bolt+s://`)
- Configure Grafana to use HTTPS

### 4. Resource Limits

Already configured in docker-compose.yml:
- Memory limits prevent DoS from runaway containers
- CPU limits ensure fair resource sharing

### 5. Regular Updates

- Monitor for security updates to:
  - Neo4j
  - Ollama
  - Docker base images
  - Node.js dependencies
- Run `npm audit` regularly
- Use Snyk or similar tools for vulnerability scanning

### 6. Environment Variables

**Do:**
- ✅ Store secrets in `.env` file (excluded from git)
- ✅ Use strong, randomly generated passwords
- ✅ Rotate credentials periodically
- ✅ Use Docker secrets for orchestration (Swarm/Kubernetes)

**Don't:**
- ❌ Commit `.env` to version control
- ❌ Use default passwords
- ❌ Hardcode secrets in code
- ❌ Share credentials in chat/email

### 7. Backup and Recovery

**Regular Backups:**
```bash
# Backup Neo4j data
docker exec mimir_neo4j neo4j-admin database dump neo4j --to-path=/backups

# Copy backup to host
docker cp mimir_neo4j:/backups ./backups/
```

**Encrypt Backups:** Store backups encrypted and in a secure location.

### 8. Monitoring and Auditing

- Review Grafana dashboards for unusual activity
- Monitor Neo4j query logs for suspicious patterns
- Set up alerts for failed authentication attempts
- Track resource usage for anomalies

### 9. Least Privilege Principle

Already implemented:
- ✅ Docker containers run as non-root user (`node`)
- ✅ Read-only workspace mount
- ✅ Minimal base images (Alpine)

### 10. Production Checklist

Before deploying to production:

- [ ] Changed all default passwords
- [ ] Configured firewall rules
- [ ] Enabled HTTPS/TLS
- [ ] Set up regular backups
- [ ] Configured monitoring alerts
- [ ] Reviewed and limited exposed ports
- [ ] Updated all dependencies
- [ ] Tested disaster recovery procedures
- [ ] Documented security procedures
- [ ] Configured log aggregation

## Known Security Considerations

### 1. Workspace Mount

The workspace is mounted read-only (`/workspace:ro`) to prevent container compromise from affecting host files.

### 2. Embeddings Privacy

When using local Ollama embeddings:
- ✅ No data sent to external services
- ✅ All processing happens locally
- ✅ No API keys required

### 3. Docker Socket

This project does **not** mount `/var/run/docker.sock` - maintaining container isolation.

## Security Scanning

Run security scans before deployment:

```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Scan for vulnerabilities
snyk test

# Scan Docker images
snyk container test mimir-mcp-server:latest
```

## Compliance

This project follows:
- OWASP Top 10 (2025) security guidelines
- CWE Top 25 mitigation strategies
- Docker CIS Benchmark recommendations
- 12-Factor App methodology

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Neo4j Security Documentation](https://neo4j.com/docs/operations-manual/current/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Updates

This security policy is reviewed and updated quarterly. Last update: November 13, 2025.
