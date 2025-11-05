import { GameStatus } from "@/api/src/types";
import { useUserId } from "@/providers/Auth";
import { useUpdateGameSettings } from "@/hooks/useUpdateGameSettings";
import { Alert } from "@/ui/components/AlertBanner";
import { Button, Container, Icon, Text, TextInput } from "@/ui/elements";
import { colors } from "@/ui/styles";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, TouchableOpacity } from "react-native";

import { useCurrentGame } from "../PlayingContext";

export function GameSettingsButton() {
  const { game } = useCurrentGame();
  const userId = useUserId();
  const { updateSettings, isUpdatingSettings } = useUpdateGameSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [startingLives, setStartingLives] = useState(String(game.initialLives));

  useEffect(() => {
    if (!isVisible) {
      setStartingLives(String(game.initialLives));
    }
  }, [game.initialLives, isVisible]);

  const isHostWaitingForPlayers =
    game.status === GameStatus.GatheringPlayers && game.host === userId;

  const handleOpen = useCallback(() => {
    setStartingLives(String(game.initialLives));
    setIsVisible(true);
  }, [game.initialLives]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedLives = Number(startingLives);

    if (!Number.isInteger(parsedLives)) {
      Alert.error({ message: "Starting lives must be a whole number." });
      return;
    }

    if (parsedLives < 1 || parsedLives > 10) {
      Alert.error({
        message: "Starting lives must be between 1 and 10.",
      });
      return;
    }

    const result = await updateSettings(game.gameId, {
      initialLives: parsedLives,
    });

    if (result !== null) {
      Alert.success({
        message: `Starting lives updated to ${result}.`,
      });
      setIsVisible(false);
    }
  }, [game.gameId, startingLives, updateSettings]);

  const handleChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setStartingLives(digitsOnly);
  }, []);

  if (!isHostWaitingForPlayers) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Open game settings"
        accessibilityRole="button"
        onPress={handleOpen}
        style={{
          padding: 8,
          borderRadius: 24,
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        }}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Icon name="settings" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Container
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Container
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: colors.white,
              borderRadius: 20,
              padding: 24,
              gap: 20,
            }}
          >
            <Text size={24} color="darkText">
              Game Settings
            </Text>

            <Container style={{ gap: 12 }}>
              <Text size={18} color="darkText">
                Starting lives
              </Text>
              <Text size={14} color="lightText">
                Everyone in the game will begin with this many lives.
              </Text>
              <TextInput
                keyboardType="number-pad"
                value={startingLives}
                onChangeText={handleChange}
                style={{
                  alignSelf: "center",
                  width: 120,
                }}
                maxLength={2}
              />
            </Container>

            <Container style={{ flexDirection: "row", gap: 12 }}>
              <Button
                title="Cancel"
                color="gray"
                fullWidth
                onPress={handleClose}
              />
              <Button
                title="Save"
                color="lightGreen"
                fullWidth
                onPress={handleSave}
                loading={isUpdatingSettings}
              />
            </Container>
          </Container>
        </Container>
      </Modal>
    </>
  );
}

