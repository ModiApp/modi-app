import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

import { Button, Icon, ScreenContainer, Text } from "@/ui/elements";
import { colors } from "@/ui/styles";

const AboutScreen: React.FC = () => {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Button onPress={() => router.back()} fullWidth={false}>
          <Icon name="back" size={28} color="white" />
        </Button>
        <Text size={32} style={{ marginLeft: 12 }}>
          About Modi
        </Text>
      </View>

      <ScrollView style={{ marginTop: 16 }}>
        <Text size={20} style={{ marginBottom: 12 }}>
          Modi is a fast-paced, multiplayer card game inspired by "Pass the Ace."
          Each round, every player gets one face-down card and tries to avoid
          ending the round with the lowest-ranked card.
        </Text>

        <Text size={24} style={{ marginBottom: 8 }}>
          How to use the app
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Enter a username on the landing screen.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Tap "Create Game" to host, or "Join Game" to enter a shared Game
          PIN.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Share the Game PIN with friends so they can join your lobby.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Follow the in-game prompts to stick, swap, or draw when you are the
          dealer.
        </Text>

        <Text size={24} style={{ marginBottom: 8 }}>
          Quick rules
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Everyone starts with 3 lives. Lose a life whenever you hold the
          lowest card at the end of a round.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Card order is Ace (lowest) up to King (highest).
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • On your turn, choose to Stick (keep your card) or Swap with the
          player to your left.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • The dealer may draw a new card from the deck instead of swapping.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Kings are protected. Trying to swap with a King triggers a "Kung"
          and ends your turn.
        </Text>

        <Text size={24} style={{ marginBottom: 8 }}>
          Special events to watch for
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Modi: your swap gives you a lower-ranked card.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Dirty Dan: your swap gives you the same rank.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • Kung: you tried to swap with a King, so the swap is denied.
        </Text>

        <Text size={24} style={{ marginBottom: 8 }}>
          End of round & winning
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • After everyone acts, all cards are revealed and the lowest card(s)
          lose a life.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • The dealer rotates to the left each round.
        </Text>
        <Text style={{ marginBottom: 12 }}>
          • The last player with lives remaining wins. If everyone loses their
          last life in the same round, the game resets for a double game.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.gray,
            marginVertical: 16,
          }}
        />

        <Text size={18} style={{ marginBottom: 32 }}>
          Want more detail? Check the full Game Rules in the docs folder or in
          the repository README for deeper strategy notes.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
};

export default AboutScreen;
