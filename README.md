<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS" />
  <h1 align="center"><code>⌘ Auth API</code></h1>
</p>

<p align="center">
  <b>Production‑ready authentication template</b> — NestJS 11 · Prisma ORM · JWT · RBAC · Rate‑limiting · Structured logging
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node%2020-339933?logo=nodedotjs&logoColor=fff" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS%2011-E0234E?logo=nestjs&logoColor=fff" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript%206-3178C6?logo=typescript&logoColor=fff" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma%205-2D3748?logo=prisma&logoColor=fff" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=fff" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff" />
</p>

---

## ✦ Overview

A **standardized REST API** for user authentication, built as a starter template that scales from local prototyping to production deployments.

| Feature | Status |
|---------|--------|
| Registration via single‑use invite codes | ✅ |
| Invite code generation (Admin / Moderator) | ✅ |
| JWT access tokens (short‑lived) | ✅ |
| Refresh token rotation (UUID + DB storage) | ✅ |
| **Atomic** rotation (concurrent‑race safe via `updateMany`) | ✅ |
| Role‑Based Access Control (Admin / Moderator / Donator / User) | ✅ |
| Rate limiting (configurable + **stricter per‑route for auth**) | ✅ |
| Structured JSON logging (Pino) | ✅ |
| **Request correlation ID** (`genReqId` + `x-request-id`) | ✅ |
| **Security headers** (Helmet) | ✅ |
| **Health check** endpoint (DB ping) | ✅ |
| **Prometheus metrics** endpoint | ✅ |
| **Email / username case normalization** (lowercased on register/login) | ✅ |
| **Password change** | ✅ |
| **User self‑deletion** | ✅ |
| **Admin user deletion** | ✅ |
| **Admin user list pagination** | ✅ |
| **DTO‑validated role updates** (`@IsEnum`) | ✅ |
| **Scheduled expired‑token cleanup** (hourly) | ✅ |
| **Production‑env validation** at startup | ✅ |
| Multi‑database support (5 providers) | ✅ |
| Swagger / OpenAPI docs | ✅ |
| Docker Compose (NestJS + PostgreSQL) | ✅ |
| E2E test suite (41 tests) | ✅ |

---

## ✦ Quick Start

```bash
npm install
npm run setup                    # generate Prisma client → push schema → seed
npm run dev                      # http://localhost:4000
```

```bash
# register
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","email":"alice@test.com","password":"Str0ng!Pass","inviteCode":"INVITE-2024-001"}'

# login
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"Str0ng!Pass"}'

# profile
curl http://localhost:4000/api/user/profile \
  -H 'Authorization: Bearer <TOKEN>'
```

> Swagger UI is available at [`http://localhost:4000/docs`](http://localhost:4000/docs).

---

## ✦ Swagger / OpenAPI

The API is fully documented with **@nestjs/swagger** (OpenAPI 3.0). After starting the server, visit:

| Resource | URL |
|----------|-----|
| Swagger UI | [`http://localhost:4000/docs`](http://localhost:4000/docs) |
| OpenAPI JSON | [`http://localhost:4000/docs-json`](http://localhost:4000/docs-json) |

### Tags

Endpoints are organized under two tags in the Swagger UI:

| Tag | Endpoints | Auth |
|-----|-----------|------|
| **Authentication** | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/invite-codes` | Register/login/refresh/logout are `@Public()` — no token needed; `invite-codes` requires `ADMIN` or `MODERATOR` role + Bearer token |
| **Users** | `GET /user/profile` · `GET /user` · `PATCH /user/:id/role` | Bearer token required; list & role endpoints restricted to `ADMIN` |

### Authorize button 🔑

The Swagger UI has an **Authorize** button in the top‑right corner. Paste your JWT access token there (without the `Bearer` prefix) to unlock protected endpoints. Tokens can be obtained from `POST /auth/login` or `POST /auth/register`.

### Example flow

1. Open [`http://localhost:4000/docs`](http://localhost:4000/docs)
2. Try `POST /auth/login` with `{"username": "admin", "password": "Admin1234"}`
3. Copy the `accessToken` from the response
4. Click **Authorize** and paste the token → click **Authorize**
5. Now you can call `GET /user` and `PATCH /user/:id/role` directly from the UI

### Response schema

Every endpoint returns the standardized envelope. The Swagger UI displays the exact schema for both success and error responses, including field types, validation rules, and examples for each DTO.

---

## ✦ Database Providers

The template ships with **five Prisma schemas** — switch with a single command:

```bash
npm run db:switch postgres          # PostgreSQL
npm run db:switch mysql            # MySQL
npm run db:switch mssql            # Microsoft SQL Server
npm run db:switch mongo            # MongoDB
npm run db:switch sqlite           # SQLite (default)
```

Each command copies the matching provider schema to `prisma/schema.prisma` and prints a `DATABASE_URL` hint.

> **Note:** `npm run setup` generates the client and pushes the schema. Run it after switching providers.

### Provider schemas

```
prisma/providers/
├── schema.postgres.prisma      # PostgreSQL
├── schema.mysql.prisma         # MySQL
├── schema.mssql.prisma         # SQL Server
├── schema.mongodb.prisma       # MongoDB  (Δ: @db.ObjectId, no Cascade)
└── schema.sqlite.prisma        # SQLite   (Δ: no enums — String field)
```

---

## ✦ Architecture

```
src/
├── main.ts                     # Bootstrap · Helmet · Pino Logger · Swagger · Global guards
├── app.module.ts               # Root module · LoggerModule · ThrottlerModule · RolesGuard
├── common/
│   ├── constants/role.ts       # TS Role enum (ADMIN, MODERATOR, DONATOR, USER)
│   ├── decorators/roles.decorator.ts
│   ├── guards/roles.guard.ts   # @Roles() → 403 on mismatch
│   ├── response.interceptor.ts # { success, data, message, timestamp }
│   └── http-exception.filter.ts
├── auth/
│   ├── auth.controller.ts      # register · login · refresh · logout · invite-codes
│   ├── auth.service.ts         # Case‑normalized register/login
│   ├── token.service.ts        # JWT + refresh‑token generation, atomic rotation, cleanup
│   ├── token-cleanup.service.ts# Scheduled hourly cleanup of expired / revoked tokens
│   ├── jwt.strategy.ts         # Passport strategy (sub + role in payload)
│   ├── jwt-auth.guard.ts       # Global guard · @Public() bypass
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       └── refresh.dto.ts
├── user/
│   ├── user.controller.ts      # profile · list (ADMIN, paginated) · updateRole · changePassword · delete
│   ├── user.service.ts
│   └── dto/
│       ├── change-password.dto.ts
│       └── update-role.dto.ts
├── health/
│   ├── health.controller.ts    # GET /health · DB ping
│   └── health.module.ts
├── metrics/
│   ├── metrics.controller.ts   # GET /metrics · Prometheus text format
│   └── metrics.module.ts
└── prisma/
    ├── prisma.service.ts       # Singleton PrismaClient
    └── prisma.module.ts
```

---

## ✦ Endpoints

All endpoints return the standard envelope (`success`, `data`, `message`, `timestamp`).

---

### `POST /api/auth/register`
Create an account. Requires a valid single‑use invite code.

**Request**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "inviteCode": "INVITE-2024-001"
}
```

**Validation**

| Field | Rules |
|-------|-------|
| `username` | 3–30 chars, alphanumeric + underscores |
| `email` | valid email |
| `password` | 8–128 chars, uppercase + lowercase + digit |
| `inviteCode` | must exist and be unused |

**Response `201`**
```json
{
  "success": true,
  "data": { "accessToken": "…", "refreshToken": "uuid" },
  "message": "Created",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

---

### `POST /api/auth/login`

**Request**
```json
{ "username": "john_doe", "password": "Str0ng!Pass" }
```

**Response `201`** — same shape as register.

---

### `POST /api/auth/refresh`
Exchange a valid refresh token for a new pair. **The old token is revoked** (rotation).

**Request**
```json
{ "refreshToken": "uuid-from-previous-response" }
```

**Response `201`** — new `accessToken` + `refreshToken`.

---

### `POST /api/auth/logout`
Revoke a refresh token immediately.

**Request**
```json
{ "refreshToken": "uuid-to-revoke" }
```

**Response `201`**
```json
{ "success": true, "data": { "message": "Logged out" }, … }
```

---

### `POST /api/auth/invite-codes` <sub>🔒 ADMIN / MODERATOR</sub>
Generate one or more single-use invite codes. Requires `ADMIN` or `MODERATOR` role.

**Request**
```json
{ "count": 1 }
```

| Field | Type | Default | Rules |
|-------|------|---------|-------|
| `count` | integer (optional) | `1` | 1–10 |

**Response `201`**
```json
{
  "success": true,
  "data": { "codes": ["INVITE-A1B2C3D4E5F6G7H8"] },
  "message": "Created",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

---

### `GET /api/user/profile`
Requires `Authorization: Bearer <accessToken>`.

**Response `200`**
```json
{
  "success": true,
  "data": { "id": "…", "username": "john_doe", "email": "john@example.com", "role": "USER", "createdAt": "…" }
}
```

---

### `GET /api/user` <sub>🔒 ADMIN</sub>
List all users (paginated). `@Roles(Role.ADMIN)`.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `skip` | integer | `0` | Records to skip |
| `take` | integer | `100` | Records to take (max 100) |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "users": [ { "id": "…", "username": "…", "email": "…", "role": "USER", "createdAt": "…" } ],
    "total": 42,
    "skip": 0,
    "take": 100
  }
}
```

---

### `PATCH /api/user/:id/role` <sub>🔒 ADMIN</sub>
Change a user's role. Uses DTO with `@IsEnum(Role)` validation.

**Request**
```json
{ "role": "MODERATOR" }
```

---

### `PATCH /api/user/profile/password`
Change the authenticated user's password.

**Request**
```json
{ "currentPassword": "Str0ng!Pass", "newPassword": "N3w!Pass456" }
```

---

### `DELETE /api/user/profile`
Delete the authenticated user's account permanently.

**Response `200`**
```json
{ "success": true, "data": { "message": "User deleted" }, … }
```

---

### `DELETE /api/user/:id` <sub>🔒 ADMIN</sub>
Admin‑delete any user account.

---

### `GET /api/health`
Public health check that pings the database.

**Response `200`**
```json
{ "success": true, "data": { "status": "ok", "database": "connected" }, … }
```

---

### `GET /api/metrics`
Prometheus metrics (default process metrics collected via `prom-client`). `@Public()`. Not shown in Swagger.

---

## ✦ Role Hierarchy

| Role | Tag | Permissions |
|------|-----|-------------|
| `ADMIN` | 🔒 | List users · Update roles · Generate invite codes |
| `MODERATOR` | 🛡 | Generate invite codes |
| `DONATOR` | ⭐ | (same as USER) |
| `USER` | 👤 | Profile, login, refresh |

Seeded users (password same as username + `1234`): `admin` / `mod` / `donor`.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin1234"}'
```

---

## ✦ Rate Limiting

Configured globally via `@nestjs/throttler`:

| Variable | Default | Meaning |
|----------|---------|---------|
| `THROTTLE_TTL` | `60` | Window (seconds) |
| `THROTTLE_LIMIT` | `60` | Max requests per window |

Returns **`429 Too Many Requests`** when exceeded.

---

## ✦ Structured Logging

Uses **nestjs-pino** with `bufferLogs: true`. Logs are output as newline‑delimited JSON:

```json
{"level":30,"time":1720500000000,"pid":1,"hostname":"...","name":"NestFactory","msg":"Starting Nest application..."}
```

Add **pino-pretty** for human‑readable output in development:

```bash
npm run dev | npx pino-pretty
```

---

## ✦ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `4000` | HTTP port |
| `NODE_ENV` | `development` | Environment (controls `entrypoint.sh` behavior — production uses `migrate deploy`, dev uses `db push` + seed) |
| `PUBLIC_URL` | — | Public HTTPS origin (e.g. `https://api.example.com`). When set, Swagger UI uses this URL for the spec, HSTS headers are disabled (trusts the upstream proxy), and `trust proxy` is enabled |
| `CORS_ORIGIN` | `*` | Allowed CORS origin (set to your frontend URL in production, e.g. `https://app.example.com`) |
| `DATABASE_URL` | `file:./dev.db` | Prisma datasource URL |
| `JWT_SECRET` | `dev-secret-123` | HMAC secret for access tokens |
| `JWT_EXPIRATION` | `15m` | Access token TTL (ms‑format, e.g. `15m`, `1h`) |
| `THROTTLE_TTL` | `60` | Rate‑limit window (seconds) |
| `THROTTLE_LIMIT` | `60` | Max requests per window |

---

## ✦ Deploying with HTTPS (Cloudflare Tunnel, ALB, nginx)

When the API runs on an **EC2 instance** accessed via public IP over HTTP, Swagger UI fails because browsers auto‑upgrade subresource requests to HTTPS (`ERR_SSL_PROTOCOL_ERROR`). The fix: set `PUBLIC_URL` to point requests at the public HTTPS origin.

### 👉 Quick fix: Cloudflare Tunnel (free, no domain needed)

Creates an HTTPS tunnel in one command — no account required.

```bash
# 1. Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/cloudflared

# 2. Start tunnel (keep this terminal open)
cloudflared tunnel --url http://localhost:5050
```

Look for this in the output:

```
Your quick Tunnel has been created! Visit it at:
https://<random-words>.trycloudflare.com
```

```bash
# 3. Restart the API with PUBLIC_URL
export PUBLIC_URL=https://<random-words>.trycloudflare.com
npm run start:prod
```

Open **`https://<random-words>.trycloudflare.com/docs`** — Swagger UI works over HTTPS.

> ⚠️ Quick tunnels have no uptime guarantee. For production, use a named tunnel with a Cloudflare account: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps

### What `PUBLIC_URL` does

| Effect | Reason |
|---|---|
| Disables Helmet's HSTS header | Prevents browser from forcing HTTPS before the proxy |
| Sets `trust proxy` | Express trusts `X-Forwarded-*` headers from the proxy |
| Adds a server entry to the OpenAPI spec | "Try it out" requests hit the correct origin |
| Configures Swagger's `url` option | Spec loaded from the public HTTPS endpoint |

### 🔄 Application Load Balancer

1. Create an ALB with an HTTPS listener (port 443)
2. Request a free ACM certificate in the same region
3. Target group forwards HTTP:5050 to the EC2 instance
4. Use the ALB DNS name as `PUBLIC_URL`

### 🔧 nginx + Let's Encrypt

```nginx
# /etc/nginx/sites-available/api
server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo certbot --nginx -d api.example.com
PUBLIC_URL=https://api.example.com
```

---

## ✦ Docker Compose

```bash
npm run docker:build        # build image
npm run docker:up           # start api + postgres
npm run docker:down         # stop everything
```

> **First‑run step:** switch Prisma provider to PostgreSQL inside the container:
> ```bash
> docker compose exec api npm run db:switch postgres
> docker compose restart api
> ```

---

## ✦ Testing

```bash
npm run test:e2e
```

41 tests covering registration, login, refresh‑token rotation (atomic, expired, revoked), logout, invite‑code generation, RBAC enforcement (incl. tampered JWT, DTO validation), paginated user list, case normalization, password change, user self‑deletion, admin user deletion, health check, and error‑response contract. A dedicated `test.db` is used and automatically cleaned up.

---

## ✦ Scripts Reference

| Script | Action |
|--------|--------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Watch mode (auto‑restart) |
| `npm run start:prod` | Run from `dist/main.js` |
| `npm run type-check` | `tsc --noEmit` (type‑check only) |
| `npm run lint` | `tsc --noEmit` (type‑check only) |
| `npm run setup` | `prisma:generate` + `prisma:push` + `seed` |
| `npm run seed` | Seed users (admin/mod/donor) + invite codes |
| `npm run test:e2e` | End‑to‑end test suite |
| `npm run db:switch <provider>` | Swap Prisma provider schema |
| `npm run docker:build` | `docker compose build` |
| `npm run docker:up` | `docker compose up -d` |

---

## ✦ License

MIT — free for any use.