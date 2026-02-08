# Auth Race Condition Fix Notes

## Problem Analysis

### PR #75's approach (Clawdia's fix - commit `e3a06b2`)
Changed AuthProvider from sequential `signInAnonymously → getIdToken → setUserId` to `onAuthStateChanged` listener that:
1. Sets `userId` immediately when `onAuthStateChanged` fires
2. Sets `isLoading = false` immediately
3. Refreshes token in background (fire-and-forget)

**What it fixed:** The green screen bug when opening a game link directly. The original sequential flow was slow, and although `SplashScreenProvider` waits for `isAuthLoading`, there may have been edge cases where the splash hid before auth completed on deep links.

**What it broke:** A NEW race condition. Other code (like `useCreateGame`) calls `getIdToken()` after checking that `userId` is set. With PR #75, `userId` gets set BEFORE the token refresh completes, so `getIdToken()` can return stale/invalid tokens.

### Original code's approach (pre-PR#75)
Sequential: `signInAnonymously().then(getIdToken(true)).then(setUserId).finally(setIsLoading(false))`

This was safe for tokens (token always ready when `userId` is set) but slower for returning users since it didn't use `onAuthStateChanged` which fires from Firebase's cached auth state.

## The Fix (Option B)

Use `onAuthStateChanged` for faster auth pickup BUT keep `isLoading = true` until the token refresh completes:

```typescript
auth.onAuthStateChanged(async (user) => {
  if (user) {
    setUserId(user.uid);
    // AWAIT token refresh BEFORE marking loading complete
    try {
      await user.getIdToken(true);
    } catch (e) {
      console.warn("Failed to refresh ID token", e);
    }
    setIsLoading(false);  // Only NOW is auth truly ready
  } else {
    signInAnonymously(auth).catch(err => {
      setError(err);
      setIsLoading(false);
    });
  }
});
```

This gives us:
- ✅ Fast auth for returning users (onAuthStateChanged fires from cache)
- ✅ Splash screen stays visible until auth + token are BOTH ready
- ✅ No green screen on direct links (splash waits for isLoading)
- ✅ No token race conditions (isLoading gates all downstream code)

## Testing Results
- Game creation: ✅ Works (token is valid when createGame fires)
- Direct game link: ✅ Works (no green screen, game loads correctly)
- Splash screen: ✅ Stays visible until auth completes
