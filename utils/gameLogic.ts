import { Card, GameSettings, GameState, Player, SwapResult } from '../types/game';

// Standard 52-card deck
export const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  suits.forEach(suit => {
    ranks.forEach((rank, index) => {
      deck.push({
        suit,
        rank,
        value: index + 1 // A=1, 2=2, ..., K=13
      });
    });
  });

  return deck;
};

// Shuffle deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Deal one card to each player for highcard determination
export const dealHighcards = (players: { [playerId: string]: Player }, deck: Card[]): { players: { [playerId: string]: Player }, remainingDeck: Card[] } => {
  const shuffledDeck = shuffleDeck(deck);
  const updatedPlayers = { ...players };
  const playerIds = Object.keys(players);

  playerIds.forEach((playerId, index) => {
    updatedPlayers[playerId] = {
      ...players[playerId],
      card: shuffledDeck[index]
    };
  });

  const remainingDeck = shuffledDeck.slice(playerIds.length);
  return { players: updatedPlayers, remainingDeck };
};

// Determine dealer based on highcard values
export const determineDealer = (players: { [playerId: string]: Player }): string => {
  const playerIds = Object.keys(players);
  let highestValue = 0;
  let dealerId = playerIds[0];

  playerIds.forEach(playerId => {
    const player = players[playerId];
    if (player.card && player.card.value > highestValue) {
      highestValue = player.card.value;
      dealerId = playerId;
    }
  });

  return dealerId;
};

// Deal cards for a regular round (dealer deals to others first, then themselves)
export const dealRoundCards = (players: { [playerId: string]: Player }, deck: Card[], dealerId: string): { players: { [playerId: string]: Player }, remainingDeck: Card[] } => {
  const shuffledDeck = shuffleDeck(deck);
  const updatedPlayers = { ...players };
  const playerIds = Object.keys(players);
  
  // Find dealer position and create ordered list starting with player to dealer's left
  const dealerIndex = playerIds.indexOf(dealerId);
  const orderedPlayerIds = [
    ...playerIds.slice(dealerIndex + 1), // Players to dealer's right
    ...playerIds.slice(0, dealerIndex),  // Players to dealer's left
    dealerId // Dealer last
  ];

  // Deal one card to each player in order
  orderedPlayerIds.forEach((playerId, index) => {
    updatedPlayers[playerId] = {
      ...players[playerId],
      card: shuffledDeck[index],
      isDealer: playerId === dealerId,
      position: index,
      hasGoneThisRound: false
    };
  });

  const remainingDeck = shuffledDeck.slice(playerIds.length);
  return { players: updatedPlayers, remainingDeck };
};

// Get next player in turn order (left of dealer goes first)
export const getNextPlayer = (currentPlayerId: string, players: { [playerId: string]: Player }, dealerId: string): string => {
  const playerIds = Object.keys(players);
  const dealerIndex = playerIds.indexOf(dealerId);
  
  // Create ordered list starting with player to dealer's left
  const orderedPlayerIds = [
    ...playerIds.slice(dealerIndex + 1), // Players to dealer's right
    ...playerIds.slice(0, dealerIndex),  // Players to dealer's left
    dealerId // Dealer last
  ];

  const currentIndex = orderedPlayerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % orderedPlayerIds.length;
  return orderedPlayerIds[nextIndex];
};

// Get player to the left of a given player
export const getPlayerToLeft = (playerId: string, players: { [playerId: string]: Player }, dealerId: string): string => {
  const playerIds = Object.keys(players);
  const dealerIndex = playerIds.indexOf(dealerId);
  
  // Create ordered list starting with player to dealer's left
  const orderedPlayerIds = [
    ...playerIds.slice(dealerIndex + 1), // Players to dealer's right
    ...playerIds.slice(0, dealerIndex),  // Players to dealer's left
    dealerId // Dealer last
  ];

  const currentIndex = orderedPlayerIds.indexOf(playerId);
  const leftIndex = (currentIndex - 1 + orderedPlayerIds.length) % orderedPlayerIds.length;
  return orderedPlayerIds[leftIndex];
};

// Process a swap action
export const processSwap = (fromPlayerId: string, players: { [playerId: string]: Player }, dealerId: string): SwapResult => {
  const toPlayerId = getPlayerToLeft(fromPlayerId, players, dealerId);
  const fromPlayer = players[fromPlayerId];
  const toPlayer = players[toPlayerId];

  if (!fromPlayer.card || !toPlayer.card) {
    return { success: false, modi: false, dirtyDan: false, kung: false };
  }

  // Check if target has a King (Kung)
  if (toPlayer.card.rank === 'K') {
    return { 
      success: false, 
      modi: false, 
      dirtyDan: false, 
      kung: true,
      swappedCard: toPlayer.card
    };
  }

  // Perform the swap
  const tempCard = fromPlayer.card;
  players[fromPlayerId].card = toPlayer.card;
  players[toPlayerId].card = tempCard;

  // Check for Modi (swapper got a lower card)
  const modi = toPlayer.card.value < fromPlayer.card.value;
  
  // Check for Dirty Dan (same rank)
  const dirtyDan = toPlayer.card.rank === fromPlayer.card.rank;

  return {
    success: true,
    modi,
    dirtyDan,
    kung: false,
    swappedCard: toPlayer.card
  };
};

// Dealer draws from deck
export const dealerDraw = (dealerId: string, players: { [playerId: string]: Player }, deck: Card[]): { players: { [playerId: string]: Player }, remainingDeck: Card[] } => {
  if (deck.length === 0) {
    return { players, remainingDeck: deck };
  }

  const updatedPlayers = { ...players };
  const newCard = deck[0];
  const remainingDeck = deck.slice(1);

  updatedPlayers[dealerId] = {
    ...players[dealerId],
    card: newCard
  };

  return { players: updatedPlayers, remainingDeck };
};

// Find players with lowest card(s)
export const findLowestCards = (players: { [playerId: string]: Player }): string[] => {
  const playerIds = Object.keys(players);
  let lowestValue = 14; // Higher than any card
  let lowestPlayers: string[] = [];

  playerIds.forEach(playerId => {
    const player = players[playerId];
    if (player.card && player.lives > 0) {
      if (player.card.value < lowestValue) {
        lowestValue = player.card.value;
        lowestPlayers = [playerId];
      } else if (player.card.value === lowestValue) {
        lowestPlayers.push(playerId);
      }
    }
  });

  return lowestPlayers;
};

// Check if any player has 0 lives
export const checkForDoubleGame = (players: { [playerId: string]: Player }): boolean => {
  const playerIds = Object.keys(players);
  return playerIds.some(playerId => players[playerId].lives === 0);
};

// Check if game is over (only one player with lives remaining)
export const isGameOver = (players: { [playerId: string]: Player }): boolean => {
  const playerIds = Object.keys(players);
  const playersWithLives = playerIds.filter(playerId => players[playerId].lives > 0);
  return playersWithLives.length <= 1;
};

// Get the winner (player with lives remaining)
export const getWinner = (players: { [playerId: string]: Player }): string | null => {
  const playerIds = Object.keys(players);
  const playersWithLives = playerIds.filter(playerId => players[playerId].lives > 0);
  return playersWithLives.length === 1 ? playersWithLives[0] : null;
};

// Check if deck needs reshuffling (when deck is empty)
export const needsReshuffle = (deck: Card[], trashPile: Card[]): boolean => {
  return deck.length === 0 && trashPile.length > 0;
};

// Reshuffle trash pile into deck
export const reshuffleTrashPile = (deck: Card[], trashPile: Card[]): { deck: Card[], trashPile: Card[] } => {
  const shuffledTrash = shuffleDeck(trashPile);
  return { deck: shuffledTrash, trashPile: [] };
};

// Initialize a new game
export const initializeGame = (gameId: string, settings: GameSettings): GameState => {
  const deck = shuffleDeck(createDeck());
  
  return {
    id: gameId,
    status: 'waiting',
    players: {},
    currentTurn: null,
    dealer: null,
    roundNumber: 0,
    gameNumber: 1,
    deck,
    trashPile: [],
    gameStartTime: Date.now(),
    lastActionTime: Date.now(),
    winner: null,
    roundState: {
      phase: 'dealing',
      highcardRound: false,
      cardsDealt: false,
      roundComplete: false
    },
    notifications: {
      modi: null,
      dirtyDan: null,
      kung: null
    }
  };
};

// Card generation utilities for test setup
export const generateDeck = (): string[] => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
  return ranks.flatMap(rank => suits.map(suit => `${rank}_of_${suit}`));
};