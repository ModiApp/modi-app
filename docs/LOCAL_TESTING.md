# Local Testing Guide for Modi

## Quick Start

Run all services locally:

```bash
# Terminal 1: Firebase Emulators
yarn emulators:start

# Terminal 2: Web App
yarn web

# Terminal 3: API Server
yarn api:dev
```

Or use the combined command (but separate terminals are better for debugging):
```bash
yarn dev
```

## Environment Setup

For local development, ensure `.env.local` has the production API URL **commented out**:

```env
# EXPO_PUBLIC_API_BASE_URL="https://api.modi.app"  # Commented for local dev
```

And `.env` has the local settings:

```env
EXPO_PUBLIC_EMULATOR_HOST=localhost
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Testing Push Notifications

### What Can Be Tested Locally

1. **Token Save Flow**
   ```bash
   EXPO_PUBLIC_EMULATOR_HOST=localhost npx tsx scripts/test-push-token-save.ts
   ```

2. **Firestore Rules**
   - Test via emulator UI at http://localhost:4000/firestore
   - Verify rules using the test script above

3. **Service Worker Registration**
   - Open http://localhost:8081 in browser
   - Check DevTools > Application > Service Workers

4. **UI Flow**
   - Create a game
   - Click "Enable Notifications" 
   - Verify UI handles permission denied/granted states

### What Cannot Be Tested in Headless Browsers

- Actual notification permission prompts (always denied in headless mode)
- FCM token retrieval (requires granted permission)
- Push notification delivery

For full notification testing, use a real browser session.

## Testing Against Production

To test the token save flow against production Firebase:

```bash
# Without emulator host = connects to production
npx tsx scripts/test-push-token-save.ts
```

## Firebase Emulator UI

- Overview: http://localhost:4000
- Auth: http://localhost:4000/auth
- Firestore: http://localhost:4000/firestore
- Realtime Database: http://localhost:4000/database

## Common Issues

### "CORS policy" errors
- Make sure `.env.local` doesn't override `EXPO_PUBLIC_API_BASE_URL` to production

### "auth/network-request-failed"
- Make sure Firebase emulators are running
- Check `EXPO_PUBLIC_EMULATOR_HOST=localhost` is set

### Service worker not updating
- Clear browser cache
- Unregister old service worker in DevTools
