import React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import UsernameInput from "@/ui/components/UsernameInput";
import {
  Button,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  Text,
} from "@/ui/elements";

export interface HomeScreenProps {
  isCreatingGame: boolean;
  shouldAskForUsername: boolean;
  isUsernameValid: boolean;
  usernameError: string | null;
  onAboutPress: () => void;
  onCreateGameBtnPressed: () => void;
  onJoinGameBtnPressed: () => void;
  onUsernameValidationChange: (isValid: boolean, error: string | null) => void;
}

function HomeScreenBase({
  onJoinGameBtnPressed,
  onCreateGameBtnPressed,
  isCreatingGame,
  shouldAskForUsername,
  usernameError,
  onAboutPress,
  onUsernameValidationChange,
}: HomeScreenProps) {
  return (
    <ScreenContainer>
      <View style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
        <Button
          onPress={onAboutPress}
          fullWidth={false}
          style={{
            padding: 8,
            borderRadius: 16,
          }}
        >
          <Icon name="information-circle" size={22} color="white" />
        </Button>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 16}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text size={64}>Modi</Text>
        </View>

        {shouldAskForUsername && (
          <Text color="error" size={16} style={{ marginBottom: 8, textAlign: "center" }}>
            Please enter a valid username
          </Text>
        )}
        <UsernameInput
          error={usernameError}
          onValidationChange={onUsernameValidationChange}
        />
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
