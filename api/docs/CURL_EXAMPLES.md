# Folderly API – cURL Examples

```bash
export BASE=http://localhost:5000
export API=$BASE/api/v1
```
> Refresh tokens live in an httpOnly cookie. Use `-c jar.txt` to save and `-b jar.txt` to send cookies.
> Tools used: `curl` and optionally `jq` (to extract values).

---
## 0. Health
```bash
curl $BASE/health
```

## 1. Auth

### Login (admin) – saves access token + refresh cookie
`identifier` = username or email. Rate-limited (10 / 15 min / IP). 5 wrong passwords → 423 lock for 15 min.
```bash
TOKEN=$(curl -s -c jar.txt -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin","password":"ChangeMe#12345"}' | jq -r .data.accessToken)
echo $TOKEN
```

### Refresh access token (rotates refresh cookie)
```bash
TOKEN=$(curl -s -b jar.txt -c jar.txt -X POST $API/auth/refresh | jq -r .data.accessToken)
```

### Current user
```bash
curl -s $API/auth/me -H "Authorization: Bearer $TOKEN"
```

### Change my password (revokes all sessions → login again)
Policy: 12–72 chars, upper + lower + number + special.
```bash
curl -X POST $API/auth/change-password -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"OldPassw0rd!234","newPassword":"NewStr0ng#Passw0rd"}'
```

### Logout (this device) / Logout everywhere
```bash
curl -X POST -b jar.txt $API/auth/logout
curl -X POST $API/auth/logout-all -H "Authorization: Bearer $TOKEN"
```

---
## 2. Users (admin token required)

### Create user
Roles: `admin | marketing | sales | hr | finance | support`. `username` = 3–30 chars of `a-z 0-9 _ -` (used in S3 path).
```bash
USER_ID=$(curl -s -X POST $API/users -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Riya Sharma","username":"riya","email":"riya@example.com","password":"Str0ng#Passw0rd!","role":"marketing"}' \
  | jq -r .data.id)
echo $USER_ID
```

### List / search / filter
```bash
curl -s "$API/users?page=1&limit=20" -H "Authorization: Bearer $TOKEN"
curl -s "$API/users?role=marketing&isActive=true&search=riya" -H "Authorization: Bearer $TOKEN"
```

### Get one
```bash
curl -s $API/users/$USER_ID -H "Authorization: Bearer $TOKEN"
```

### Update name / role / active flag (role change or deactivation revokes sessions)
```bash
curl -X PATCH $API/users/$USER_ID -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Riya S.","role":"sales","isActive":true}'
```

### Admin resets a user's password
```bash
curl -X POST $API/users/$USER_ID/reset-password -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"newPassword":"Another#Str0ngPass1"}'
```

### Deactivate (soft delete)
```bash
curl -X DELETE $API/users/$USER_ID -H "Authorization: Bearer $TOKEN"
```

---
## 3. Uploads (any logged-in role)

Login as the normal user first:
```bash
USER_TOKEN=$(curl -s -c user_jar.txt -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"riya","password":"Str0ng#Passw0rd!"}' | jq -r .data.accessToken)
```

### Upload one or many files (field name must be `files`)
Stored in S3 as `ROLE/USERNAME/YYYY-MM-DD/<uuid>-<filename>`, e.g. `marketing/riya/2026-11-19/…`.
Allowed: pdf, png, jpg/jpeg, csv, txt, docx, xlsx · max 5 files · 10 MB each (configurable).
```bash
curl -s -X POST $API/uploads -H "Authorization: Bearer $USER_TOKEN" \
  -F "files=@./report.pdf" -F "files=@./photo.png"
```

### My uploads (optionally by date range)
```bash
curl -s "$API/uploads/me?page=1&limit=20&from=2026-11-01&to=2026-11-30" -H "Authorization: Bearer $USER_TOKEN"
```

### All uploads (admin) – filter by user / role / dates
```bash
curl -s "$API/uploads?userId=$USER_ID&role=marketing&from=2026-11-01&to=2026-11-30" \
  -H "Authorization: Bearer $TOKEN"
```

### Download link (5-minute presigned URL; owner or admin only)
```bash
UPLOAD_ID=<id from upload response>
URL=$(curl -s $API/uploads/$UPLOAD_ID/download -H "Authorization: Bearer $USER_TOKEN" | jq -r .data.url)
curl -o downloaded_file "$URL"
```

---
## 4. Reports / Dashboard
`from` / `to` are `YYYY-MM-DD` (default: last 30 days, max 366 days). `bytes` are in bytes.

```bash
# My own report (any role) – cannot see anyone else's
curl -s "$API/reports/me?from=2026-11-01&to=2026-11-19" -H "Authorization: Bearer $USER_TOKEN"

# Admin: organisation dashboard (totals, by role/day/type, top users)
curl -s "$API/reports/dashboard?from=2026-11-01&to=2026-11-19" -H "Authorization: Bearer $TOKEN"

# Admin: per-user table (includes users with 0 uploads)
curl -s "$API/reports/users?page=1&limit=20&role=marketing&from=2026-11-01&to=2026-11-19" -H "Authorization: Bearer $TOKEN"

# Admin: one user's detailed report
curl -s "$API/reports/users/$USER_ID?from=2026-11-01&to=2026-11-19" -H "Authorization: Bearer $TOKEN"
```

---
## 5. Security / RBAC checks (expected results)
```bash
# normal user -> admin endpoints  => 403
curl -i $API/users               -H "Authorization: Bearer $USER_TOKEN"
curl -i $API/reports/dashboard   -H "Authorization: Bearer $USER_TOKEN"
curl -i $API/reports/users/$USER_ID -H "Authorization: Bearer $USER_TOKEN"
curl -i $API/uploads             -H "Authorization: Bearer $USER_TOKEN"

# no token => 401
curl -i $API/reports/me

# NoSQL injection attempt on login => 400 (validation failed)
curl -i -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":{"$ne":null},"password":{"$ne":null}}'

# disallowed file type => 415
echo '<?php echo 1;' > shell.php
curl -i -X POST $API/uploads -H "Authorization: Bearer $USER_TOKEN" -F "files=@shell.php"
```

## Error format
```json
{ "success": false, "message": "Validation failed",
  "details": [ { "path": "password", "message": "Needs a special character" } ] }
```
| Code | Meaning |
|---|---|
| 400 | Validation error / bad input |
| 401 | Missing, invalid or expired token / bad credentials |
| 403 | Authenticated but role lacks permission |
| 404 | Not found (also used for others' files) |
| 409 | Duplicate username/email |
| 413 / 415 | File too large / type not allowed |
| 423 | Account temporarily locked |
| 429 | Rate limit hit |
