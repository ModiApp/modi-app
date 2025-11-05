import React from "react";
import { Keyboard, KeyboardAvoidingView, View } from "react-native";

import {
  Button,
  Icon,
  LoadingSpinner,
  ScreenContainer,
  Text,
  TextInput,
} from "@/ui/elements";

export interface JoinLobbyScreenProps {
  isValidatingLobbyId: boolean;
  validationError?: string;
  isLobbyIdInvalid: boolean;
  lobbyId: string;
  onLobbyIdChange: (lobbyId: string) => void;
  onLobbyIdSet: (lobbyId: string) => void;
  onCancel: () => void;
}
const JoinLobbyScreenBase: React.FC<JoinLobbyScreenProps> = ({
  onLobbyIdSet,
  lobbyId,
  onLobbyIdChange,
  isValidatingLobbyId,
  isLobbyIdInvalid,
  validationError,
  onCancel,
}) => (
  <ScreenContainer>
    <Button onPress={onCancel} style={{ alignSelf: "flex-start" }}>
      <Icon name="back" size={28} color="white" />
    </Button>
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: "center" }}
      behavior="padding"
      onTouchEnd={Keyboard.dismiss}
    >
      <View style={{ margin: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isValidatingLobbyId && <LoadingSpinner size="small" color="white" />}
          <Text
            color={isLobbyIdInvalid || validationError ? "red" : "white"}
            size={16}
            style={{ margin: 8 }}
          >
            {isLobbyIdInvalid
              ? "Invalid Game PIN"
              : validationError
              ? validationError
              : isValidatingLobbyId
              ? "Joining..."
              : "Join Existing Game"}
          </Text>
        </View>

        <TextInput
          style={{ fontSize: 24 }}
          placeholder="Game PIN"
          value={lobbyId}
          onChangeText={(text) => {
            onLobbyIdChange(text);
            if (text.length === 4) {
              onLobbyIdSet(text);
            }
          }}
          autoFocus
          keyboardType="number-pad"
        />
      </View>
    </KeyboardAvoidingView>
  </ScreenContainer>
);

export default JoinLobbyScreenBase;
