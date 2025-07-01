import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  drawCard,
  initializeTestGame,
  reshuffleDeck,
  subscribeToTestGame,
  switchCurrentPlayer,
  TestGame,
} from "../services/testGameService";
import {
  cardIdentifierToCard,
  TEST_PLAYER_1_ID,
  TEST_PLAYER_2_ID,
} from "../utils/testUtils";

export default function Test() {
  const [game, setGame] = useState<TestGame | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string>(TEST_PLAYER_1_ID);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTestGame((gameData) => {
      setGame(gameData);
    });

    return () => unsubscribe();
  }, []);

  const handleDrawCard = async () => {
    setLoading(true);
    try {
      await drawCard(currentPlayer);
    } catch (error) {
      console.error("Failed to draw card:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReshuffle = async () => {
    setLoading(true);
    try {
      await reshuffleDeck();
    } catch (error) {
      console.error("Failed to reshuffle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlayer = async () => {
    setLoading(true);
    try {
      await switchCurrentPlayer();
      setCurrentPlayer(
        currentPlayer === TEST_PLAYER_1_ID ? TEST_PLAYER_2_ID : TEST_PLAYER_1_ID
      );
    } catch (error) {
      console.error("Failed to switch player:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeGame = async () => {
    setLoading(true);
    try {
      await initializeTestGame();
    } catch (error) {
      console.error("Failed to initialize game:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (cardIdentifier: string | null) => {
    if (!cardIdentifier) return "No card";
    const card = cardIdentifierToCard(cardIdentifier);
    return `${card.rank} of ${card.suit}`;
  };

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Firebase Cloud Functions Test</Text>
        <Text>No game data found.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleInitializeGame}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Initializing..." : "Initialize Test Game"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Cloud Functions Test</Text>

      <View style={styles.gameInfo}>
        <Text style={styles.subtitle}>Game State:</Text>
        <Text>Deck size: {game.deck.length} cards</Text>
        <Text>Current player: {game.currentPlayer}</Text>
        <Text>
          Last action: {new Date(game.lastActionTime).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.playerSection}>
        <Text style={styles.subtitle}>Players:</Text>
        {Object.entries(game.players).map(([playerId, player]) => (
          <View key={playerId} style={styles.playerCard}>
            <Text
              style={[
                styles.playerName,
                playerId === currentPlayer && styles.currentPlayer,
              ]}
            >
              {player.name} {playerId === currentPlayer ? "(Current)" : ""}
            </Text>
            <Text>Card: {formatCard(player.card)}</Text>
            <Text>Lives: {player.lives}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDrawCard}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Drawing..." : "Draw Card"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReshuffle}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Reshuffling..." : "Reshuffle Deck"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSwitchPlayer}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Switching..." : "Switch Player"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleInitializeGame}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Initializing..." : "Reinitialize Game"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },
  gameInfo: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerSection: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  currentPlayer: {
    color: "#007bff",
  },
  buttonSection: {
    gap: 15,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

/**
 *
 * This component will fetch the deck state from the database and display
 */
function CardDeck(props: { forGameId: string }) {}
