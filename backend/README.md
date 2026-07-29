# Mini Social Feed - Backend

Node.js / Express REST API for the Mini Social Feed App. Text-only posts, likes, comments,
JWT authentication, and Firebase Cloud Messaging (FCM) push notifications.

**Stack:** Node.js, TypeScript (strict mode), Express, Prisma ORM, PostgreSQL, JWT, Firebase Admin SDK.

---

## 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (local, [Render Postgres](https://render.com), Supabase, Neon, etc.)
- A Firebase project with Cloud Messaging enabled (for push notifications) — optional for local dev

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, and (optionally) Firebase credentials
```

Generate the Prisma client (also required once after editing `schema.prisma`):

```bash
npx prisma generate
```

Run the initial migration to create the database schema:

```bash
npx prisma migrate dev --name init
```

(Optional) seed the database with two test users and a sample post:

```bash
npm run seed
```

Start the server:

```bash
npm run dev      # ts-node-dev, auto-restarts on changes, runs TS directly
# or, for a production-style run:
npm run build    # compiles src/**/*.ts -> dist/ with strict type-checking
npm start        # runs the compiled dist/index.js
```

`npm run typecheck` runs `tsc --noEmit` on its own if you just want to check types without building.

The API listens on `http://localhost:4000` by default (see `PORT` in `.env`).
A health check is available at `GET /health`.

> **Note:** `npx prisma generate` needs network access to `binaries.prisma.sh` to download its
> query engine. If you're running this behind a restrictive firewall/proxy, allow that domain (or
> use Prisma's Data Proxy / a pre-built Docker image that already bundles the engine).

## 3. Firebase Cloud Messaging setup

1. In the [Firebase Console](https://console.firebase.google.com), create a project (or reuse one)
   and enable Cloud Messaging.
2. Go to **Project Settings > Service Accounts > Generate new private key**. This downloads a JSON file.
3. Either:
   - Save it as `backend/firebase-service-account.json` and set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`
     (default already points here), **or**
   - Paste the full JSON contents as a single-line string into `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env`
     (recommended for hosting providers like Render, where you set env vars in a dashboard rather than
     uploading files).
4. The mobile app registers its FCM device token via `POST /api/auth/fcm-token` (or at login/signup) so the
   backend knows where to deliver notifications.

If Firebase isn't configured, the API still runs normally — push notifications are just skipped with a
log message, so you can develop the rest of the app before wiring up Firebase.

## 4. Deploying to Render

1. Push this `backend/` folder to GitHub (see the top-level repo README).
2. In Render, create a **PostgreSQL** instance and copy its **Internal Database URL**.
3. Create a **Web Service**, point it at the repo, set the root directory to `backend`.
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start command: `npm start`
4. Add environment variables in the Render dashboard: `DATABASE_URL` (from step 2), `JWT_SECRET`,
   `JWT_EXPIRES_IN`, `CORS_ORIGIN`, and either `FIREBASE_SERVICE_ACCOUNT_JSON` or upload the service
   account file and set `FIREBASE_SERVICE_ACCOUNT_PATH`.
5. Deploy. Confirm `GET /health` returns `{ "status": "ok" }`.

## 5. Project structure

```
backend/
├── prisma/
│   ├── schema.prisma      # User, Post, Like, Comment models
│   └── seed.ts            # optional test data
├── src/
│   ├── config/            # Prisma client, Firebase Admin init
│   ├── controllers/       # request handlers (business logic)
│   ├── middleware/         # auth, validation, error handling
│   ├── routes/            # route definitions + input validation rules
│   ├── types/express.d.ts # augments Express's Request with req.user
│   └── index.ts           # app entrypoint
├── tsconfig.json          # strict mode enabled
├── .env.example
└── package.json
```

---

## 6. API Reference

All endpoints (except signup/login) require an `Authorization: Bearer <token>` header.
All request/response bodies are JSON. Validation errors return `422` with a `details` array.

### Auth

#### `POST /api/auth/signup`
Create a new account.

Request body:
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```
- `username`: 3-20 characters, letters/numbers/underscores only
- `password`: minimum 6 characters

Response `201`:
```json
{
  "user": { "id": "uuid", "username": "alice", "email": "alice@example.com", "createdAt": "..." },
  "token": "jwt-token"
}
```

#### `POST /api/auth/login`
```json
{ "email": "alice@example.com", "password": "secret123", "fcmToken": "optional-device-token" }
```
Response `200`: same shape as signup. Passing `fcmToken` updates the stored device token for push
notifications in the same call.

#### `POST /api/auth/fcm-token` 🔒
Register/refresh the current device's FCM token (e.g. call this whenever the app obtains a new token).
```json
{ "fcmToken": "device-token-from-firebase" }
```

#### `GET /api/auth/me` 🔒
Returns the authenticated user's profile.

---

### Posts

#### `POST /api/posts` 🔒
Create a text-only post.
```json
{ "content": "Hello world!" }
```
Response `201`:
```json
{
  "post": {
    "id": "uuid",
    "content": "Hello world!",
    "createdAt": "...",
    "author": { "id": "uuid", "username": "alice" },
    "likeCount": 0,
    "commentCount": 0,
    "likedByMe": false
  }
}
```

#### `GET /api/posts` 🔒
Paginated feed, newest first.

Query params:
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | 1-indexed |
| `limit` | int | 10 | max 50 |
| `username` | string | - | filter feed to one author (case-insensitive) |

Response `200`:
```json
{
  "posts": [ { "id": "...", "content": "...", "author": {...}, "likeCount": 3, "commentCount": 1, "likedByMe": true } ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5, "hasNextPage": true }
}
```

#### `GET /api/posts/:id` 🔒
Fetch a single post by id.

---

### Interactions

#### `POST /api/posts/:id/like` 🔒
Toggles a like (calling it again on the same post un-likes it). Sends an FCM push notification to the
post's author (unless they're liking their own post).

Response `200`:
```json
{ "liked": true, "likeCount": 4 }
```

#### `POST /api/posts/:id/comment` 🔒
Adds a comment and notifies the post's author via FCM.
```json
{ "content": "Nice post!" }
```
Response `201`:
```json
{ "comment": { "id": "uuid", "content": "Nice post!", "createdAt": "...", "user": { "id": "uuid", "username": "bob" } } }
```

#### `GET /api/posts/:id/comments` 🔒
Paginated comments for a post (`page`, `limit` query params, oldest first).

---

## 7. Error format

```json
{ "error": "Human-readable message" }
```
Validation errors additionally include:
```json
{ "error": "Validation failed.", "details": [{ "field": "email", "message": "A valid email is required." }] }
```
