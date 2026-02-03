# Dead Code Analysis

Generated: Feb 3, 2026 (knip)
Status: **Queued for cleanup after current PRs merge**

## Unused Files (15)

### Test Infrastructure (stale)
- `functions/__tests__/cleanupStaleData.test.ts`
- `functions/__tests__/setup.test.ts`
- `functions/__tests__/setup.ts`
- `functions/jest.config.js`

### Debug/Admin Scripts
- `functions/scripts/check-archived.ts`
- `functions/scripts/sample-archived.ts`
- `scripts/check-archived.ts`
- `scripts/check-cleanup.ts`
- `scripts/check-orphaned.ts`
- `scripts/debug-presence.ts`
- `scripts/test-push-token-save.ts`

### Orphaned Components
- `ui/components/PlayerCircle.tsx` - replaced by PlayerCircles
- `ui/components/PlayerList.tsx` - unused

### Other
- `functions/src/index.ts` - empty barrel?
- `public/firebase-messaging-sw.js` - web push service worker (keep?)

## Unused Dependencies

### To Remove
```bash
yarn remove @react-navigation/elements @react-navigation/native expo-image expo-symbols expo-web-browser
yarn remove -D babel-plugin-transform-remove-console
```

### To Add (unlisted but used)
```bash
yarn add expo-updates expo-asset lodash
```

## Unused Exports (prioritize cleanup)

### Safe to remove
- `api/src/types/index.ts`: test, isWaitingForPlayers, isActive, isEnded
- `api/src/util.ts`: getCardRankValue
- `ui/styles.ts`: fontSizes, spacings, sizing (use specific values instead)
- `utils/validation.ts`: USERNAME_MIN_LENGTH

### Review before removing
- `providers/PushNotifications.tsx`: usePushToken - might be needed
- `ui/components/AnimatableCardDeck.tsx`: AnimatableCard - animation system
- `ui/components/NotificationPrompt.tsx`: NotificationButton
- `ui/screens/Game/components/CardTable/PlayerCircles.tsx`: calculatePlayerPositions
- `ui/screens/Game/components/CardTable/types.ts`: CARD_TABLE_CONFIG

## Unused Types
- `api/src/types/index.ts`: PlayerHand
- `ui/components/AnimatableCardDeck.tsx`: CardAnimatableProps, AnimatableCardRef
- `ui/elements/Container/index.tsx`: ContainerProps
- `ui/screens/Game/components/CardTable/types.ts`: CardAnimationValue, CardPosition, CardsRef, CardTableConfig

## Notes

The `firebase-messaging-sw.js` might be needed for web push notifications even if not directly imported. Verify before removing.

Some unused exports might be intentional API surface - review component usage before cleanup.

---

**Action plan:**
1. Wait for current 6 PRs to merge
2. Create PR for dependency cleanup (add/remove)
3. Create PR for unused file deletion
4. Create PR for unused export cleanup
