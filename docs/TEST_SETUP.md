# Firebase Cloud Functions Test Setup

This document explains how to set up and use the test environment for experimenting with Firebase Cloud Functions.

## Overview

The test setup provides a simple way to experiment with Firebase Firestore operations for the card game. It includes:

- A mock game with two players
- Real-time deck state management
- Two main actions: draw card and reshuffle deck
- Player switching for testing different scenarios

## Setup Instructions

### 1. Firebase Configuration

First, make sure your Firebase project is set up:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database
4. Get your project configuration

### 2. Update Firebase Config

Update `config/firebase.ts` with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. Firestore Security Rules

Set up Firestore security rules to allow read/write access for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /testGames/{gameId} {
      allow read, write: if true; // For testing only - change for production
    }
  }
}
```

### 4. Seed the Test Data

Run the seeding script to create the initial test game:

```bash
# Set your Firebase environment variables
export FIREBASE_API_KEY="your-api-key"
export FIREBASE_PROJECT_ID="your-project-id"
# ... other variables

# Run the seeding script
node scripts/seedTestGame.js
```

## Using the Test Screen

### Accessing the Test Screen

Navigate to `/test` in your app to access the test screen.

### Available Actions

1. **Draw Card**: Draws a card for the current player
2. **Reshuffle Deck**: Collects all cards and reshuffles the deck
3. **Switch Player**: Toggles between Player 1 and Player 2

### Real-time Updates

The test screen shows:
- Current deck size
- Player cards and lives
- Last action timestamp
- Real-time updates when data changes

## Test Game Structure

The test game uses a simplified data structure:

```typescript
interface TestGame {
  id: string;                    // Always 'test-game-123'
  deck: string[];               // Array of card identifiers
  players: {                    // Two test players
    [playerId: string]: Player;
  };
  currentPlayer: string;        // Which player is active
  lastActionTime: number;       // Timestamp of last action
}
```

### Card Identifiers

Cards are stored as strings in the format: `"rank_of_suit"`
Examples:
- `"ace_of_spades"`
- `"king_of_hearts"`
- `"ten_of_clubs"`

## Next Steps for Cloud Functions

Once you're comfortable with the client-side operations, you can:

1. **Create Cloud Functions**: Move the game logic to Firebase Cloud Functions
2. **Add Authentication**: Implement proper user authentication
3. **Add Game Rules**: Implement the full Pass the Ace game rules
4. **Add Real-time Features**: Implement player presence, chat, etc.

## Troubleshooting

### Common Issues

1. **"Firebase not configured"**: Check your `config/firebase.ts` file
2. **"Permission denied"**: Update your Firestore security rules
3. **"Test game not found"**: Run the seeding script
4. **No real-time updates**: Check your internet connection and Firebase project status

### Debug Mode

The test screen includes console logging for debugging. Check your browser's developer console for detailed information about operations.

## Security Notes

⚠️ **Important**: This test setup uses permissive security rules for development. For production:

1. Implement proper authentication
2. Add server-side validation
3. Use restrictive security rules
4. Move game logic to Cloud Functions
5. Add rate limiting and abuse prevention 