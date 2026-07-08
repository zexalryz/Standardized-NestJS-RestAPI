# Auth API

Standardized REST API for user authentication with invite-code registration.

Built with **NestJS** + **Prisma** (SQLite) + **JWT**.

## Features

- User registration with single-use invite codes
- Login with username / password
- JWT-based authentication
- Input validation (password strength, username format, email)
- Standardized JSON response envelope
- OpenAPI / Swagger documentation

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20 |
| Framework | NestJS 11 |
| Database | SQLite (via Prisma ORM) |
| Auth | Passport + JWT (bearer tokens) |
| Validation | class-validator + class-transformer |
| Docs | @nestjs/swagger (OpenAPI 3.0) |

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client, push schema & seed invite codes
npm run setup

# Start in development mode (watch)
npm run dev

# Or start production build
npm run build
npm run start:prod
```

Server starts on **http://localhost:4000** (configurable via `API_PORT` in `.env`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `4000` | Server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `JWT_SECRET` | `change-me-to-a-random-secret-in-production` | Secret for signing JWT tokens |
| `JWT_EXPIRATION` | `7d` | Token expiry duration |

## API Endpoints

Base URL: `http://localhost:4000/api`

### `POST /api/auth/register`

Create a new user account. Requires a valid single-use invite code.

**Request body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "inviteCode": "INVITE-2024-001"
}
```

**Validation rules:**

| Field | Rules |
|-------|-------|
| `username` | 3–30 chars, alphanumeric + underscores only |
| `email` | Valid email format |
| `password` | 8–128 chars, must include uppercase, lowercase, and digit |
| `inviteCode` | Must be a valid, unused invite code |

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "OK",
  "timestamp": "2026-07-08T14:44:37.386Z"
}
```

**Error responses:**

```json
// Invalid invite code
{ "success": false, "error": { "code": "Bad Request", "message": "Invalid invite code" } }

// Already used invite code
{ "success": false, "error": { "code": "Bad Request", "message": "Invite code already used" } }

// Duplicate username
{ "success": false, "error": { "code": "Conflict", "message": "Username already taken" } }

// Duplicate email
{ "success": false, "error": { "code": "Conflict", "message": "Email already registered" } }

// Validation failure
{ "success": false, "error": { "code": "Bad Request", "message": "username must be longer than or equal to 3 characters; email must be an email; ..." } }
```

---

### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request body:**

```json
{
  "username": "john_doe",
  "password": "Str0ng!Pass"
}
```

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "OK",
  "timestamp": "2026-07-08T14:44:44.060Z"
}
```

**Error responses:**

```json
// Invalid credentials
{ "success": false, "error": { "code": "Unauthorized", "message": "Invalid credentials" } }
```

---

### `GET /api/user/profile`

Get the authenticated user's profile. Requires a valid JWT in the `Authorization` header.

**Request:**

```
GET /api/user/profile
Authorization: Bearer <token>
```

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "id": "449fc9a2-374e-4f4a-b541-586e8424b289",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2026-07-08T14:44:37.363Z"
  },
  "message": "OK",
  "timestamp": "2026-07-08T14:44:53.488Z"
}
```

**Error responses:**

```json
// Missing / invalid token
{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "Unauthorized" } }

// User not found
{ "success": false, "error": { "code": "Not Found", "message": "User not found" } }
```

## Response Envelope

All responses follow the same shape:

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "timestamp": "2026-07-08T14:44:44.060Z"
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "Bad Request",
    "message": "Human-readable error description"
  },
  "timestamp": "2026-07-08T14:44:44.060Z"
}
```

## Invite Code System

5 seed invite codes are provided (see `prisma/seed.ts`):

```
INVITE-2024-001
INVITE-2024-002
INVITE-2024-003
INVITE-2024-004
INVITE-2024-005
```

Each code can be used **once only**. Once consumed, the code is marked as `used` in the database and cannot be reused.

To generate more codes at runtime, insert them directly into the `InviteCode` table:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
await p.inviteCode.create({ data: { code: 'PROMO-2024-001' } });
await p.\$disconnect();
"
```

## Project Structure

```
auth-api/
├── prisma/
│   ├── schema.prisma          # User + InviteCode models
│   └── seed.ts                # Invite code seeder
├── src/
│   ├── main.ts                # Entry point, Swagger setup, global config
│   ├── app.module.ts          # Root module
│   ├── types.d.ts             # Type declarations
│   ├── common/
│   │   ├── response.interceptor.ts   # Standard response envelope
│   │   └── http-exception.filter.ts  # Standard error envelope
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── public.decorator.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   └── prisma/
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── .env                       # Environment variables
└── package.json
```

## Testing with cURL

```bash
# Register a new user
curl -s http://localhost:4000/api/auth/register \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","email":"alice@test.com","password":"Str0ng!Pass","inviteCode":"INVITE-2024-001"}'

# Login
curl -s http://localhost:4000/api/auth/login \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"Str0ng!Pass"}'

# Get profile (replace TOKEN with actual JWT)
curl -s http://localhost:4000/api/user/profile \
  -H 'Authorization: Bearer TOKEN'
```

## Swagger / OpenAPI

- **UI:** http://localhost:4000/docs
- **JSON:** http://localhost:4000/docs-json

The Swagger UI lets you explore and test every endpoint interactively. The **Authorize** button (top right) accepts a JWT token for protected endpoints.

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start server from compiled output |
| `npm run dev` | Watch mode (auto-restart on changes) |
| `npm run start:prod` | Start from `dist/main.js` |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run seed` | Seed invite codes |
| `npm run setup` | Generate client + push schema + seed |

## License

MIT
