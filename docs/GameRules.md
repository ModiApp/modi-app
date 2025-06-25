# Pass the Ace - Game Rules & Specification

## Overview
"Pass the Ace" is a card game where players attempt to avoid having the lowest-ranking card each round. Despite the name, the Ace is actually the lowest card in the game. Players start with 3 lives and lose a life each time they have the lowest card at the end of a round.

## Game Components
- **Deck**: Standard 52-card deck
- **Players**: 2+ players (typically 4-8)
- **Lives**: Each player starts with 3 lives
- **Card Rankings**: Ace (lowest) → 2 → 3 → ... → King (highest)

## Game Setup

### 1. Initial Dealer Determination
- All players draw one card from the main deck
- Player with the highest-ranking card becomes the first dealer
- If multiple players tie for highest card, they play highcard recursively until one winner remains
- After determining dealer, return all cards to deck and reshuffle

### 2. Dealing Process
- Dealer deals one card to each player, starting with the player to their left
- Deals proceed clockwise around the table
- Dealer receives their card last
- All cards are dealt face-down
- No player can see any cards during dealing

## Gameplay Flow

### Turn Structure
1. **First Player**: Player to the left of the dealer goes first
2. **Turn Options**: Each player chooses one action:
   - **Stick**: Keep current card and pass turn to next player
   - **Swap**: Exchange card with player to their left (with restrictions)

### Swap Mechanics
- **Standard Swap**: Player exchanges their card with the player to their left
- **King Protection**: Players holding Kings cannot be forced to swap
- **"Kung"**: When a player attempts to swap with someone holding a King, the swap is denied and turn ends
- **Card Visibility**: Neither player sees the other's card before swapping

### Dealer's Special Ability
- Dealer can choose to draw a new card from the top of the deck instead of swapping
- This counts as their "swap" action for the turn
- Dealer can still choose to stick or swap normally

### Round Resolution
1. After all players have taken their turn, all cards are revealed
2. Player(s) with the lowest-ranking card lose one life
3. If multiple players tie for lowest card, all lose a life
4. All played cards go to the trash pile
5. **Dealer Rotation**: The dealer position moves one player to the left for the next round

## Special Game Events

### "Modi"
- Occurs when a player swaps and receives a card of lower rank
- Must be prominently displayed to all players
- Helps inform other players' strategic decisions

### "Dirty Dan"
- Occurs when a player swaps and receives a card of the same rank
- Must be prominently displayed to all players
- Helps inform other players' strategic decisions

### "Kung"
- Occurs when a player attempts to swap with someone holding a King
- Swap is denied and turn ends immediately
- Must be prominently displayed to all players

## Deck Management
- **Single Deck**: One deck used for entire game
- **Trash Pile**: Contains all cards from completed rounds
- **Reshuffling**: When deck runs out, shuffle entire trash pile to create new deck
- **Cards in Play**: Cards currently in players' hands remain in play during reshuffle

## Game End Conditions

### Normal Victory
- Game ends when only one player has lives remaining
- That player is declared the winner

### "Double Game" Scenario
- **Trigger**: When all remaining players lose their final life in the same round
- **Effect**: All players return to 3 lives and game restarts completely
- **Reset**: Fresh deck, new dealer determination, no memory of previous rounds
- **Recursion**: Can theoretically lead to triple, quadruple games, etc.

## Game Flow Summary

```
1. Determine initial dealer (highcard)
2. Deal one card to each player (dealer last)
3. Player to dealer's left goes first
4. Each player chooses: Stick or Swap
5. If swap attempted with King holder → "Kung"
6. If swap results in lower rank → "Modi"
7. If swap results in same rank → "Dirty Dan"
8. After all turns, reveal cards
9. Lowest card holder(s) lose life
10. If all remaining players lose final life → Double Game
11. If only one player has lives → Game Over
12. Rotate dealer one position to the left
13. Repeat from step 2 for next round
```

## Strategic Considerations
- Kings are the safest cards (cannot be swapped away)
- Aces are the most dangerous cards (lowest rank)
- "Modi" and "Dirty Dan" notifications help inform strategic decisions
- Dealer's ability to draw from deck provides unique strategic advantage
- Timing of swaps can be crucial for avoiding lowest card