import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button, Icon, ScreenContainer, Text } from "@/ui/elements";
import { colors } from "@/ui/styles";

const BODY_FONT = "alert";

const AboutScreen: React.FC = () => {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Button onPress={() => router.back()} fullWidth={false}>
          <Icon name="back" size={28} color="white" />
        </Button>
        <Text size={32} style={styles.headerTitle}>
          About Modi
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text size={20} style={styles.heroTitle}>
            Fast-paced multiplayer card battles
          </Text>
          <Text fontFamily={BODY_FONT} style={styles.bodyText}>
            Modi is inspired by \"Pass the Ace.\" Each round, every player gets
            one face-down card and tries to avoid ending with the lowest-ranked
            card.
          </Text>
        </View>

        <View style={styles.section}>
          <Text size={22} style={styles.sectionTitle}>
            How to use the app
          </Text>
          <View style={styles.list}>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              1. Enter a username on the landing screen.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              2. Tap \"Create Game\" to host, or \"Join Game\" to enter a shared
              Game PIN.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              3. Share the Game PIN so friends can join your lobby.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              4. Follow the in-game prompts to stick, swap, or draw if you are
              the dealer.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text size={22} style={styles.sectionTitle}>
            Quick rules
          </Text>
          <View style={styles.list}>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Everyone starts with 3 lives. Lose one when you hold the lowest
              card.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Card order is Ace (lowest) up to King (highest).
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • On your turn, you can Stick (keep your card) or Swap with the
              player to your left.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • The dealer may draw a new card from the deck instead of swapping.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Kings are protected. Trying to swap with one triggers a \"Kung\"
              and ends your turn.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text size={22} style={styles.sectionTitle}>
            Special events
          </Text>
          <View style={styles.list}>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Modi: your swap gives you a lower-ranked card.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Dirty Dan: your swap gives you the same rank.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • Kung: you tried to swap with a King, so the swap is denied.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text size={22} style={styles.sectionTitle}>
            End of round & winning
          </Text>
          <View style={styles.list}>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • After everyone acts, all cards are revealed and the lowest
              card(s) lose a life.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • The dealer rotates to the left each round.
            </Text>
            <Text fontFamily={BODY_FONT} style={styles.listItem}>
              • The last player with lives remaining wins. If everyone loses
              their last life in the same round, the game resets for a double
              game.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text fontFamily={BODY_FONT} style={styles.footerText}>
          Want more detail? Check the full Game Rules in the docs folder or the
          repository README for deeper strategy notes.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    marginLeft: 12,
  },
  scroll: {
    marginTop: 16,
  },
  content: {
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: 16,
    padding: 16,
  },
  heroTitle: {
    marginBottom: 8,
  },
  bodyText: {
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    backgroundColor: colors.feltGreen,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  list: {
    gap: 8,
  },
  listItem: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 20,
  },
  footerText: {
    lineHeight: 22,
  },
});
