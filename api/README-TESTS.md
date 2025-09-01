# DealCards Handler Tests

This directory contains comprehensive tests for the DealCards handler, specifically designed to verify the changes made in PR #35: "Fix deck reshuffle logic during deal cards".

## Test Setup

The tests use Jest as the testing framework with TypeScript support. All Firebase dependencies are mocked to allow for isolated unit testing.

## Running Tests

From the API directory:
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

From the workspace root:
```bash
# Run API tests
yarn test:api

# Run API tests in watch mode
yarn test:api:watch

# Run API tests with coverage
yarn test:api:coverage
```

## What the Tests Verify

### PR #35 Changes

The tests specifically verify the following changes from PR #35:

1. **New Reshuffle Logic**: Replaced the old `playerIndexOfReshuffle` approach with a new system using `actionCounter` and `lastDealtIndex`
2. **Proper Action Timing**: Actions are now created with incrementing timestamps (10ms apart) using the `actionCounter`
3. **Multiple Reshuffle Support**: The new logic properly handles scenarios where multiple reshuffles are needed during dealing
4. **Correct Action Sequencing**: Deal cards actions are created for players dealt before reshuffle, then reshuffle action, then deal cards for remaining players

### Test Scenarios

#### Basic Functionality
- ✅ Deal cards to all players when deck has enough cards
- ✅ Proper error handling for invalid game states
- ✅ Authorization checks (only dealer can deal cards)
- ✅ Game state validation

#### Reshuffle Logic (PR #35 Focus)
- ✅ Single reshuffle during dealing
- ✅ Multiple reshuffles during dealing
- ✅ Correct tracking of `lastDealtIndex` through reshuffles
- ✅ Proper action timing with `actionCounter`
- ✅ Edge cases: reshuffle needed for first player
- ✅ Multiple small reshuffles

#### Player Dealing Order
- ✅ Correct dealing order starting from player after dealer
- ✅ Skipping players with no lives remaining
- ✅ Handling single player games

#### Edge Cases
- ✅ Single player games
- ✅ Games with no players having lives
- ✅ Empty deck and trash scenarios

## Test Files

- `DealCards.test.ts` - Comprehensive test suite covering all functionality
- `DealCards-PR35-specific.test.ts` - Focused tests specifically for PR #35 changes

## Mock Strategy

The tests use comprehensive mocking to isolate the DealCards handler:

- **Firebase**: All Firebase operations are mocked to avoid external dependencies
- **Actions**: Action creation functions are mocked to verify correct calls
- **Deck Utils**: Shuffle function is mocked for predictable testing

## Key Assertions

The tests verify:

1. **Action Creation**: Correct actions are created with proper parameters
2. **Action Timing**: Actions have incrementing timestamps (10ms apart)
3. **Reshuffle Logic**: Trash is properly shuffled into deck when needed
4. **Player Hand Updates**: Cards are correctly assigned to player hands
5. **Game State Updates**: Game state transitions correctly from pre-deal to playing
6. **Error Handling**: Appropriate errors are thrown for invalid scenarios

## Coverage

The tests aim for comprehensive coverage of:
- Happy path scenarios
- Edge cases and error conditions
- All branches of the reshuffle logic
- Action creation and timing
- Player dealing order and life management

## Running Specific Tests

To run only the PR #35 specific tests:
```bash
yarn test DealCards-PR35-specific
```

To run only the basic functionality tests:
```bash
yarn test DealCards.test.ts
```

## Debugging Tests

If tests fail, you can:

1. Run with verbose output: `yarn test --verbose`
2. Run a specific test file: `yarn test DealCards.test.ts`
3. Run in watch mode for interactive debugging: `yarn test:watch`
4. Check the coverage report: `yarn test:coverage`

## Adding New Tests

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use descriptive test names that explain the scenario being tested
3. Mock all external dependencies
4. Test both success and failure cases
5. Verify the specific behavior being tested with clear assertions