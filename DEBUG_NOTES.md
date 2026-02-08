# Debug Notes: Firebase Auth Token Error

## The Bug
`FirebaseAuthError: Decoding Firebase ID token failed` when pressing "Create Game"

## Root Cause Analysis
The error "Decoding Firebase ID token failed" means the token string passed to `auth.verifyIdToken()` wasn't a valid JWT.

### Most likely original cause
The `auth.currentUser` was `null` when `createGameFunction()` ran, causing `auth.currentUser?.getIdToken()` to return `undefined`. The Authorization header became `"Bearer undefined"`, and the API tried to verify the string `"undefined"` as a JWT — which obviously fails.

This could happen if:
1. The user clicked "Create Game" before Firebase anonymous auth completed
2. A previously existing `.env.local` had `EXPO_PUBLIC_CONNECT_TO_PROD` set, causing a mismatch between frontend (production Firebase) and API (emulator Firebase)

## Changes Made

### 1. `hooks/useCreateGame.ts`
- Added null check for `auth.currentUser` before calling `getIdToken()`
- Throws a clear error ("Not authenticated - no current user") instead of silently sending "Bearer undefined"
- Added console.log for debugging

### 2. `api/src/authenticate.ts`
- Added debug logging for the Authorization header and extracted token
- Added check for `token === 'undefined'` or `token === 'null'` (string literals)
- Wrapped `verifyIdToken()` in try/catch to return proper error response instead of crashing

## Verification
- Started `yarn dev` (emulators + API + Expo)
- Opened `http://localhost:8081` in browser
- Entered username "TestPlayer", clicked "Create Game"
- Game created successfully with PIN 7496
- No auth errors in terminal
- Token was properly sent as a Firebase emulator JWT (alg: "none")
