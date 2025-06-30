import React from "react";
import { View, KeyboardAvoidingView } from "react-native";

import { Button, LoadingSpinner, ScreenContainer, Text } from "src/elements";
import UsernameInput from "src/components/UsernameInput";

export interface HomeScreenProps {
  isCreatingGame: boolean;
  shouldAskForUsername: boolean;
  onCreateGameBtnPressed: () => void;
  onJoinGameBtnPressed: () => void;
}

function HomeScreenBase({
  onJoinGameBtnPressed,
  onCreateGameBtnPressed,
  isCreatingGame,
  shouldAskForUsername,
}: HomeScreenProps) {
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={56}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text size={64}>Modi</Text>
        </View>

        {shouldAskForUsername && (
          <Text color="red" style={{ marginBottom: 8 }}>
            Enter a username:
          </Text>
        )}
        <UsernameInput />
      </KeyboardAvoidingView>
      <Button
        onPress={onJoinGameBtnPressed}
        color="blue"
        title="Join Game"
        titleStyle={{ fontSize: 28 }}
        style={{
          height: 72,
          borderRadius: 36,
          paddingHorizontal: 16,
          alignItems: "center",
          marginTop: 12,
        }}
      />
      <Button
        onPress={onCreateGameBtnPressed}
        color="red"
        disabled={isCreatingGame}
        style={{ height: 72, borderRadius: 36, marginTop: 12 }}
      >
        {isCreatingGame ? (
          <LoadingSpinner size="large" color="white" />
        ) : (
          <Text size={28}>Create Game</Text>
        )}
      </Button>
    </ScreenContainer>
  );
}

export default HomeScreenBase;
