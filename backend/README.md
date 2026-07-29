# Mini Social Feed — Backend

Express + TypeScript API on PostgreSQL (via Prisma). Handles auth, posts, likes, comments, and triggers Firebase push notifications on new likes/comments.

## Stack

Express, Prisma + PostgreSQL, JWT (`jsonwebtoken`), `bcryptjs`, `express-validator`, `firebase-admin`, `helmet` + `express-rate-limit` + `cors`.

## Setup

```bash
npm install
```

Create `.env`:

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/mini_social
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

# either one — if neither is set, the API still runs; pushes are just skipped
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Get the Firebase key: Console → Project Settings → Service Accounts → Generate new private key.

```bash
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # optional — creates alice/bob test accounts
npm run dev
```

Health check: `GET /health`

## API Reference

All routes except `/auth/signup` and `/auth/login` require `Authorization: Bearer <jwt>`.

| Method & path                              | Body                            | Notes                                                  |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------ |
| `POST /api/auth/signup`                    | `{ username, email, password }` | → `{ user, token }`                                    |
| `POST /api/auth/login`                     | `{ email, password }`           | → `{ user, token }`                                    |
| `POST /api/auth/fcm-token`                 | `{ fcmToken }`                  | auth required                                          |
| `GET /api/auth/me`                         | —                               | auth required, validates current session               |
| `POST /api/posts`                          | `{ content }` (max 2000 chars)  | → created post                                         |
| `GET /api/posts?page=&limit=&username=`    | —                               | newest-first, paginated, optional username filter      |
| `GET /api/posts/:id`                       | —                               | single post                                            |
| `POST /api/posts/:id/like`                 | —                               | toggles like → `{ liked, likeCount }`; notifies author |
| `POST /api/posts/:id/comment`              | `{ content }` (max 1000 chars)  | → created comment; notifies author                     |
| `GET /api/posts/:id/comments?page=&limit=` | —                               | paginated comment list                                 |

Post shape: `{ id, content, createdAt, author: { id, username }, likeCount, commentCount, likedByMe }`
Comment shape: `{ id, content, createdAt, user: { id, username } }`

## Errors

```jsonc
{ "error": "Human-readable message." }
```

Validation failures also include per-field detail:

```jsonc
{
  "error": "Validation failed.",
  "details": [{ "field": "email", "message": "..." }],
}
```

## Notes

- Uses `firebase-admin`'s native FCM `send()`, not Expo's push relay — the mobile app must register its raw device token, not an Expo push token.
- Push sends are fire-and-forget: a failed send (stale token, misconfigured Firebase) is logged, never fails the underlying request.
