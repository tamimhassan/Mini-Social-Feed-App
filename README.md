# Mini Social Feed App

A lightweight social media app: users sign up, post text updates, like and comment on posts, and get real-time push notifications when someone interacts with their content.

## Repo structure

```
mini-social-app/
├── backend/     # Node.js + Express + Prisma + PostgreSQL API
├── mobile/      # React Native (Expo) app
└── README.md    # you are here
```

## Quick links

- Backend setup & API docs: [`backend/README.md`](./backend/README.md)
- Mobile setup & app docs: [`mobile/README.md`](./mobile/README.md)
- Downloadable APK: [Google Drive link](https://drive.google.com/drive/folders/1tZXWJVu8XjKpFHl70bu9q9mzv4HqwxuX?usp=sharing)
- GitHub repo: [Repo](https://github.com/tamimhassan/Mini-Social-Feed-App)

## Tech stack

| Layer         | Stack                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Backend       | Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT auth, Firebase Admin SDK    |
| Mobile        | React Native, Expo (Expo Router), TypeScript, react-hook-form + yup, React Reanimated |
| Notifications | Firebase Cloud Messaging (FCM), sent from the backend via `firebase-admin`            |

## How the two pieces connect

The mobile app talks to the backend over a REST API secured with JWT (`Authorization: Bearer <token>`). On login/signup, the app registers its FCM device token with the backend (`POST /auth/fcm-token`); the backend then pushes a notification via Firebase whenever another user likes or comments on your post.

Full request/response shapes are documented in [`backend/README.md`](./backend/README.md#api-reference).

## Platform scope

This build targets **Android** (APK deliverable, per project spec). iOS is not implemented — remote push notifications on iOS require an active paid Apple Developer account (for APNs credentials), which wasn't available for this build. The notification code itself is platform-agnostic (`expo-notifications` abstracts APNs vs. FCM automatically), so iOS support is mostly a credentials/config addition, not a rewrite.

## Running the full stack locally

1. Set up and start the backend first — see [`backend/README.md`](./backend/README.md).
2. Set up and run the mobile app — see [`mobile/README.md`](./mobile/README.md).

## Test accounts

The backend seed script creates two accounts for quick manual testing:

| Email             | Password    |
| ----------------- | ----------- |
| alice@example.com | password123 |
| bob@example.com   | password123 |
