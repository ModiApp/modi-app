# Pass the Ace - Data Models & Firebase Firestore Schema

## Overview
This document defines the data models required to implement the Pass the Ace card game using Firebase Firestore. The models are designed to support real-time multiplayer gameplay with proper state management.

## Core Data Models

### 1. Game
Represents a single game instance.

```typescript
interface Game {
  id: string;                    // Firestore document ID
  status: GameStatus;            // 'waiting', 'active', 'completed', 'double_game'
  createdAt: Timestamp;          // When the game was created
  updatedAt: Timestamp;          // Last update timestamp
  
  // Player management
  players: Player[];             // Array of player objects
  maxPlayers: number;            // Maximum players allowed (default: 8)
  minPlayers: number;            // Minimum players required (default: 2)
  
  // Game state
  currentRound: number;          // Current round number (starts at 1)
  currentDealerIndex: number;    // Index of current dealer in players array
  currentPlayerIndex: number;    // Index of player whose turn it is
  
  // Deck management
  deck: Card[];                  // Current deck of cards
  trashPile: Card[];             // Discarded cards from previous rounds
  
  // Round state
  roundCards: RoundCard[];       // Cards currently in play this round
  roundActions: RoundAction[];   // Actions taken this round
  
  // Game history
  roundHistory: RoundResult[];   // Results from previous rounds
  
  // Settings
  settings: GameSettings;        // Game configuration
}
```

### 2. Player
Represents a player in the game.

```typescript
interface Player {
  id: string;                    // User ID from Firebase Auth
  displayName: string;           // Player's display name
  email: string;                 // Player's email
  photoURL?: string;             // Player's avatar URL
  
  // Game state
  lives: number;                 // Current lives (starts at 3)
  isAlive: boolean;              // Whether player is still in game
  isConnected: boolean;          // Real-time connection status
  lastSeen: Timestamp;           // Last activity timestamp
  
  // Current round
  currentCard?: Card;            // Card currently held (if any)
  hasTakenTurn: boolean;         // Whether player has acted this round
  
  // Statistics
  gamesPlayed: number;           // Total games participated in
  gamesWon: number;              // Total games won
  roundsLost: number;            // Total rounds where player lost a life
}
```

### 3. Card
Represents a playing card.

```typescript
interface Card {
  suit: CardSuit;                // 'hearts', 'diamonds', 'clubs', 'spades'
  rank: CardRank;                // 'ace', '2', '3', ..., 'king'
  value: number;                 // Numeric value (ace=1, king=13)
  
  // Card state
  isVisible: boolean;            // Whether card is face-up
  ownerId?: string;              // Player ID who currently holds this card
  location: CardLocation;        // 'deck', 'hand', 'trash'
  
  // Metadata
  cardId: string;                // Unique identifier for this card instance
  dealtAt?: Timestamp;           // When card was dealt
}
```

### 4. RoundCard
Represents a card in play during the current round.

```typescript
interface RoundCard {
  cardId: string;                // Reference to Card.cardId
  playerId: string;              // Player currently holding this card
  originalPlayerId: string;      // Player who was originally dealt this card
  isSwapped: boolean;            // Whether this card was swapped this round
  swapHistory: SwapEvent[];      // History of swaps for this card this round
}
```

### 5. RoundAction
Represents an action taken by a player during their turn.

```typescript
interface RoundAction {
  id: string;                    // Unique action ID
  playerId: string;              // Player who took the action
  actionType: ActionType;        // 'stick', 'swap', 'draw'
  timestamp: Timestamp;          // When action was taken
  
  // Action details
  targetPlayerId?: string;       // For swap actions
  cardId?: string;               // Card involved in action
  result?: ActionResult;         // Outcome of the action
}
```

### 6. RoundResult
Represents the result of a completed round.

```typescript
interface RoundResult {
  roundNumber: number;           // Which round this was
  dealerId: string;              // Who was the dealer
  playersLost: string[];         // Player IDs who lost a life
  lowestCard: Card;              // The lowest card that caused life loss
  completedAt: Timestamp;        // When round was completed
}
```

### 7. GameEvent
Represents special events that occur during gameplay.

```typescript
interface GameEvent {
  id: string;                    // Unique event ID
  eventType: EventType;          // 'modi', 'dirty_dan', 'kung', 'double_game'
  timestamp: Timestamp;          // When event occurred
  roundNumber: number;           // Which round this occurred in
  
  // Event details
  playerId: string;              // Player who triggered the event
  targetPlayerId?: string;       // Other player involved (for swaps)
  cardId?: string;               // Card involved in event
  description: string;           // Human-readable description
}
```

## Enums and Types

```typescript
enum GameStatus {
  WAITING = 'waiting',           // Waiting for players to join
  ACTIVE = 'active',             // Game in progress
  COMPLETED = 'completed',       // Game finished normally
  DOUBLE_GAME = 'double_game'    // Game restarted due to double game scenario
}

enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades'
}

enum CardRank {
  ACE = 'ace',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'jack',
  QUEEN = 'queen',
  KING = 'king'
}

enum CardLocation {
  DECK = 'deck',
  HAND = 'hand',
  TRASH = 'trash'
}

enum ActionType {
  STICK = 'stick',
  SWAP = 'swap',
  DRAW = 'draw'
}

enum EventType {
  MODI = 'modi',
  DIRTY_DAN = 'dirty_dan',
  KUNG = 'kung',
  DOUBLE_GAME = 'double_game'
}

interface ActionResult {
  success: boolean;
  message: string;
  specialEvent?: EventType;      // Derived event type if applicable
}

interface SwapEvent {
  fromPlayerId: string;
  toPlayerId: string;
  timestamp: Timestamp;
}

interface GameSettings {
  maxPlayers: number;
  minPlayers: number;
  startingLives: number;
  autoStart: boolean;            // Auto-start when min players reached
  timeLimit?: number;            // Turn time limit in seconds
}
```

## Firestore Collections Structure

```
/games/{gameId}
  - Game document with all game data
  
/games/{gameId}/players/{playerId}
  - Player subcollection (if needed for complex player data)
  
/games/{gameId}/rounds/{roundNumber}
  - Round-specific data (alternative to embedding in main game doc)
  
/games/{gameId}/events/{eventId}
  - Game events subcollection (for high-volume event tracking)
  
/users/{userId}
  - User profile and statistics
  
/users/{userId}/games/{gameId}
  - User's participation in specific games
```

## Real-time Considerations

### Security Rules
- Players can only read games they're participating in
- Players can only update their own player data
- Only game creator can update game settings
- Dealer can only update game state during their turn

### Performance Optimizations
- Use subcollections for high-volume data (events, actions)
- Index on frequently queried fields (status, playerId)
- Consider denormalization for frequently accessed data
- Use transactions for critical game state updates

### State Synchronization
- Use Firestore real-time listeners for game state changes
- Implement optimistic updates for better UX
- Handle offline scenarios gracefully
- Use server-side functions for complex game logic validation

## Event Derivation Logic

Special events (Modi, Dirty Dan, Kung) can be derived from RoundActions using the following logic:

### "Kung" Event
- Triggered when a swap action has `success: false` and the target player has a King
- Can be determined by checking if the target player's card rank is 'king'

### "Modi" Event  
- Triggered when a swap action has `success: true` and the player receives a lower-ranked card
- Compare the player's card rank before and after the swap

### "Dirty Dan" Event
- Triggered when a swap action has `success: true` and the player receives a same-ranked card
- Compare the player's card rank before and after the swap

### "Double Game" Event
- Triggered when all remaining players lose their final life in the same round
- Can be determined by checking if all alive players have 0 lives after round resolution

## Implementation Notes

1. **Card Management**: Each card should have a unique ID to track its movement through the game
2. **Turn Management**: Use currentPlayerIndex to determine whose turn it is
3. **Dealer Rotation**: Increment currentDealerIndex after each round
4. **Life Management**: Track lives separately from isAlive for double game scenarios
5. **Event Derivation**: Calculate special events on-demand from RoundActions for UI display
6. **Deck Reshuffling**: When deck is empty, move trash pile to deck and shuffle
7. **Connection Handling**: Track player connection status for timeout scenarios 

## How the Data Models Are Used

### Game Lifecycle

#### 1. Game Creation & Setup
```typescript
// When a player creates a new game
const newGame: Game = {
  id: generateId(),
  status: GameStatus.WAITING,
  players: [creatorPlayer], // Only the creator initially
  currentRound: 0,
  currentDealerIndex: -1, // Not set until game starts
  currentPlayerIndex: -1,
  deck: createShuffledDeck(), // Full 52-card deck
  trashPile: [],
  roundCards: [],
  roundActions: [],
  roundHistory: [],
  settings: defaultSettings
}
```

#### 2. Player Joining
```typescript
// When a player joins an existing game
game.players.push(newPlayer);
// Update game.updatedAt timestamp
// Check if game.players.length >= game.settings.minPlayers to auto-start
```

#### 3. Game Start (Initial Dealer Determination)
```typescript
// Deal one card to each player for highcard
game.roundCards = dealHighcardCards(game.players, game.deck);
// Find player with highest card
game.currentDealerIndex = findHighestCardPlayer(game.roundCards);
// Return cards to deck and reshuffle
game.deck = reshuffleDeck([...game.deck, ...game.roundCards]);
game.roundCards = [];
game.status = GameStatus.ACTIVE;
game.currentRound = 1;
```

#### 4. Round Start (Dealing)
```typescript
// Deal one card to each player, starting with player to dealer's left
game.roundCards = dealRoundCards(game.players, game.currentDealerIndex, game.deck);
// Set current player to left of dealer
game.currentPlayerIndex = (game.currentDealerIndex + 1) % game.players.length;
// Reset turn flags
game.players.forEach(p => p.hasTakenTurn = false);
```

#### 5. Player Turn Processing
```typescript
// When a player takes an action
const action: RoundAction = {
  id: generateId(),
  playerId: currentPlayer.id,
  actionType: playerChoice, // 'stick', 'swap', or 'draw'
  timestamp: now(),
  targetPlayerId: targetPlayer?.id, // For swap actions
  cardId: cardInvolved?.cardId
};

// Process the action based on type
switch (action.actionType) {
  case 'stick':
    action.result = { success: true, message: 'Player stuck with current card' };
    break;
    
  case 'swap':
    if (targetPlayer.currentCard.rank === 'king') {
      // Kung event
      action.result = { 
        success: false, 
        message: 'Cannot swap with King holder',
        specialEvent: EventType.KUNG 
      };
    } else {
      // Perform swap
      const swapResult = performCardSwap(currentPlayer, targetPlayer);
      action.result = {
        success: true,
        message: 'Cards swapped successfully',
        specialEvent: determineSwapEvent(swapResult) // Modi, Dirty Dan, or none
      };
    }
    break;
    
  case 'draw':
    // Only dealer can draw
    if (currentPlayerIndex === currentDealerIndex) {
      const newCard = drawFromDeck(game.deck);
      currentPlayer.currentCard = newCard;
      action.result = { success: true, message: 'Dealer drew new card' };
    }
    break;
}

game.roundActions.push(action);
currentPlayer.hasTakenTurn = true;
```

#### 6. Turn Progression
```typescript
// Move to next player who hasn't taken their turn
do {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
} while (game.players[game.currentPlayerIndex].hasTakenTurn);

// Check if round is complete
if (game.players.every(p => p.hasTakenTurn)) {
  resolveRound(game);
}
```

#### 7. Round Resolution
```typescript
function resolveRound(game: Game) {
  // Reveal all cards
  game.roundCards.forEach(rc => rc.card.isVisible = true);
  
  // Find lowest card(s)
  const lowestCards = findLowestCards(game.roundCards);
  
  // Players with lowest cards lose a life
  lowestCards.forEach(card => {
    const player = game.players.find(p => p.id === card.playerId);
    player.lives--;
    if (player.lives === 0) player.isAlive = false;
  });
  
  // Check for double game scenario
  const alivePlayers = game.players.filter(p => p.isAlive);
  if (alivePlayers.length === 0) {
    // All players lost final life simultaneously - Double Game
    game.status = GameStatus.DOUBLE_GAME;
    resetGameForDoubleGame(game);
    return;
  }
  
  // Check for game end
  if (alivePlayers.length === 1) {
    game.status = GameStatus.COMPLETED;
    return;
  }
  
  // Create round result
  const roundResult: RoundResult = {
    roundNumber: game.currentRound,
    dealerId: game.players[game.currentDealerIndex].id,
    playersLost: lowestCards.map(c => c.playerId),
    lowestCard: lowestCards[0].card,
    completedAt: now()
  };
  
  game.roundHistory.push(roundResult);
  
  // Move cards to trash pile
  game.trashPile.push(...game.roundCards.map(rc => rc.card));
  game.roundCards = [];
  game.roundActions = [];
  
  // Rotate dealer
  game.currentDealerIndex = (game.currentDealerIndex + 1) % game.players.length;
  
  // Start next round
  game.currentRound++;
  startNewRound(game);
}
```

### Real-time UI Updates

#### 1. Game State Listeners
```typescript
// Listen for game state changes
const unsubscribe = onSnapshot(doc(db, 'games', gameId), (doc) => {
  const game = doc.data() as Game;
  
  // Update UI based on game status
  switch (game.status) {
    case GameStatus.WAITING:
      showLobby(game.players);
      break;
    case GameStatus.ACTIVE:
      showGameBoard(game);
      break;
    case GameStatus.COMPLETED:
      showGameResults(game);
      break;
    case GameStatus.DOUBLE_GAME:
      showDoubleGameAnnouncement();
      break;
  }
});
```

#### 2. Turn Management
```typescript
// Check if it's current user's turn
const isMyTurn = game.currentPlayerIndex === myPlayerIndex && 
                 !game.players[myPlayerIndex].hasTakenTurn;

if (isMyTurn) {
  showTurnOptions(game);
} else {
  showWaitingForPlayer(game.players[game.currentPlayerIndex]);
}
```

#### 3. Special Event Display
```typescript
// Derive and display special events from recent actions
const recentActions = game.roundActions.slice(-5); // Last 5 actions
const specialEvents = deriveSpecialEvents(recentActions);

specialEvents.forEach(event => {
  switch (event.type) {
    case EventType.MODI:
      showModiNotification(event);
      break;
    case EventType.DIRTY_DAN:
      showDirtyDanNotification(event);
      break;
    case EventType.KUNG:
      showKungNotification(event);
      break;
  }
});
```

#### 4. Card Visibility
```typescript
// Show/hide cards based on game state
game.roundCards.forEach(roundCard => {
  const isMyCard = roundCard.playerId === myPlayerId;
  const isRevealed = game.status === GameStatus.COMPLETED || 
                     roundCard.card.isVisible;
  
  if (isMyCard || isRevealed) {
    showCard(roundCard.card);
  } else {
    showCardBack();
  }
});
```

### Data Persistence Patterns

#### 1. Optimistic Updates
```typescript
// Update UI immediately, then sync to database
function takeAction(action: ActionType) {
  // Optimistic update
  updateLocalGameState(action);
  
  // Sync to Firestore
  updateDoc(doc(db, 'games', gameId), {
    roundActions: arrayUnion(action),
    currentPlayerIndex: nextPlayerIndex,
    updatedAt: now()
  });
}
```

#### 2. Transactional Updates
```typescript
// Use transactions for critical game state changes
function performSwap(fromPlayerId: string, toPlayerId: string) {
  return runTransaction(db, async (transaction) => {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await transaction.get(gameRef);
    const game = gameDoc.data() as Game;
    
    // Validate swap is legal
    if (!canSwap(game, fromPlayerId, toPlayerId)) {
      throw new Error('Invalid swap');
    }
    
    // Perform swap
    const updatedGame = performCardSwap(game, fromPlayerId, toPlayerId);
    
    // Update in transaction
    transaction.update(gameRef, updatedGame);
  });
}
```

#### 3. Offline Support
```typescript
// Queue actions when offline
function queueAction(action: RoundAction) {
  if (!navigator.onLine) {
    // Store in local storage for later sync
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    pendingActions.push(action);
    localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
  } else {
    // Send immediately
    sendAction(action);
  }
}
```

### Performance Considerations

#### 1. Selective Listening
```typescript
// Only listen to specific fields that affect UI
const gameRef = doc(db, 'games', gameId);
onSnapshot(gameRef, { includeMetadataChanges: true }, (doc) => {
  const game = doc.data() as Game;
  
  // Only update UI if relevant fields changed
  if (doc.metadata.hasPendingWrites) {
    // Local changes - show optimistic updates
    return;
  }
  
  // Remote changes - update UI
  updateGameUI(game);
});
```

#### 2. Pagination for History
```typescript
// Load round history in chunks
function loadRoundHistory(gameId: string, limit: number = 10) {
  const historyRef = collection(db, 'games', gameId, 'rounds');
  return getDocs(query(historyRef, orderBy('roundNumber', 'desc'), limit(limit)));
}
```

This data model supports a complete real-time multiplayer card game with proper state management, offline capabilities, and efficient UI updates. 