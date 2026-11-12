# SecNotes (Vulnerable Version)

**Strictly educational and local/lab use only.**
Never expose this application on the Internet or in a production environment.

## Objective
SecNotes is a mini Express + MongoDB API designed to accompany DevSecOps training:
- GitLab CI/CD
- Local GitLab Runner
- Local SonarQube
- Docker
- Local Kubernetes
- Terraform / AWS

## Educational Vulnerabilities Included
- V1: NoSQL Injection
- V2: Hardcoded Secrets
- V3: Missing Input Validation
- V4: IDOR / Insufficient Access Control
- V5: Outdated / Vulnerable Dependencies
- V6: Weak Hashing (MD5)
- V7: Insecure Dockerfile
- V8: Overly Verbose Logs
- V9: Plain Text Kubernetes Secrets (base64)
- V10: Overly Permissive CORS

## Quick Start
```bash
npm install
docker run -d --name secnotes-mongo -p 27017:27017 mongo:6
npm start
```

API available at `http://localhost:3000`

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/:id`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/notes/search?q=...`

## Example
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"azerty123","role":"admin"}'
```

## Important Note
The code is intentionally weak so that SonarQube, code review, and manual analysis have material to work with.

