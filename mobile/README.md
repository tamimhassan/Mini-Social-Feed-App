# Mini Social Feed — Mobile

React Native (Expo) app: auth, feed with likes/comments, post creation, push notifications.

## Stack

Expo Router (file-based nav), TypeScript, `react-hook-form` + `yup` (all forms), `react-native-reanimated`, `axios` (JWT auto-attached via interceptor), `expo-notifications` + `expo-device`, `AsyncStorage` (session persistence).

## Setup

```bash
npm install
```

Point the app at your backend — copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_API_URL=https://mini-social-feed-app-api.onrender.com/api
```

Changing `.env` requires a full restart with cache clear: `npx expo start -c` — a hot reload alone won't pick it up.

**Firebase:** add an Android app in Firebase Console (package name must match `app.json`'s `android.package`), download `google-services.json` to the project root, and confirm `app.json` references it under `android.googleServicesFile` with `"expo-notifications"` in `plugins`.

**Run (Android):**

```bash
npx expo run:android
```

Use this, not `npx expo start` alone — native modules (Reanimated, notifications) require a custom dev client, not plain Expo Go.

## Architecture

```
app/
├── _layout.tsx        # AuthProvider, gesture handler, push notification listeners
├── (auth)/             # login, signup — redirects to feed if already logged in
├── (app)/              # feed, create-post, post/[id] — redirects to login if not authed
services/
├── api.ts              # axios instance + JWT interceptor + error normalization
├── auth.service.ts      # auth calls, maps raw API → app models
├── post.service.ts      # posts/likes/comments, maps raw API → app models
└── notification.service.ts
context/AuthContext.tsx  # user/token state, session validation on launch
utils/validation.ts      # yup schemas shared across every form
utils/formErrors.ts      # maps backend field errors onto react-hook-form fields
components/PostCard.tsx  # optimistic like toggle
```

**Auth:** JWT persisted in `AsyncStorage`, attached automatically by an axios interceptor. On launch, `AuthContext` re-validates the session via `GET /auth/me` rather than trusting the cached user indefinitely.

**API mapping:** the backend's field names (`content`, `author.username`, page-based pagination)

**Forms:** every form uses `react-hook-form` + a `yup` schema mirroring the backend's validation rules exactly, so invalid input is caught before it hits the network.

**Push notifications:** registers the raw device token (`getDevicePushTokenAsync()` — FCM, not Expo's push token) since the backend sends via `firebase-admin` directly. Token is registered right after login/signup. `app/_layout.tsx` handles foreground notifications and deep-links to the relevant post on tap.

## Build APK

```bash
eas build:configure
```

Set `eas.json`'s `preview` profile to `{ "android": { "buildType": "apk" } }`, then:

```bash
eas build --platform android --profile preview
```

## Platform scope

Android only — iOS push needs a paid Apple Developer account for APNs, not available for this build. Code is cross-platform already; iOS would need `GoogleService-Info.plist` + an `ios.bundleIdentifier` + APNs key upload, no JS changes.
