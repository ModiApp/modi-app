# Mobile Safari Green Screen Bug — Debug Report

## Bug
Opening a game link (e.g., `/games/3452`) on iOS Safari shows a blank green screen instead of the game lobby.

**User description:** "the Home Screen flashes for a second then it seems to try to take you to the game screen then it just shows all green forever"

## Reproduced
✅ Confirmed in iOS Simulator (iPhone 17 Pro, iOS 26). Screenshot shows blank green page with the Vercel URL loaded in Safari.

## Root Cause
**Auth/Firestore race condition in `useGame` hook.**

The sequence on mobile Safari:
1. App loads, splash hides (fonts + username ready)
2. Router navigates to `/games/3452`
3. `GameScreen` mounts → calls `useGame("3452")`
4. `useGame` immediately subscribes to Firestore via `onSnapshot`
5. **BUT Firebase Auth hasn't completed yet** (anonymous sign-in is still in-flight)
6. Firestore read without auth → either permission error (silent) or empty snapshot → `game = null`
7. `game === null` triggers `router.replace("/")` → redirect to home
8. Home screen renders briefly, but the green `contentStyle` background from the Stack is all that's visible

**Why it works on desktop Chrome but not mobile Safari:**
- Chrome caches Firebase auth state more aggressively / completes auth faster
- Mobile Safari has slower cold-start auth, so the race window is wider

## Fix (commit `6821337`)

### 1. `useGame.ts` — Guard Firestore subscription on auth readiness
```typescript
const { isLoading: isAuthLoading, userId } = useAuth();

useEffect(() => {
  if (isAuthLoading || !userId) return; // Don't subscribe until auth is ready
  return subscribeToGame(gameId, ...);
}, [gameId, router, isAuthLoading, userId]);
```

### 2. `Game/index.tsx` — Show spinner when game is null (redirecting)
Instead of rendering an empty `<ScreenContainer />` (just green), show a loading spinner while the redirect happens.

## Branch
`fix/revert-and-fix-auth-race` — pushed to origin.
