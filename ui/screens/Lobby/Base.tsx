import React from "react";
import { KeyboardAvoidingView } from "react-native";

import { InitialGame } from "@/functions/src/types";
import { PlayersList } from "@/ui/components/PlayerList";
import { Button, Container, Text } from "@/ui/elements";
import { JoinGameButton } from "../Game/components/JoinGameButton";
import { LeaveGameButton } from "../Game/components/LeaveGameButton";
import { StartGameButton } from "../Game/components/StartGameButton";

export interface LobbyScreenProps {
  currUserId: string;
  game: InitialGame;
  /**
   * Typical native share interface for sharing the link to this game page.
   */
  onInviteFriendsBtnPressed: () => void;
}
const LobbyScreen: React.FC<LobbyScreenProps> = ({
  game,
  currUserId,
  onInviteFriendsBtnPressed,
}) => (
  <KeyboardAvoidingView
    behavior="height"
    style={{ flex: 1, paddingTop: 32, gap: 16 }}
  >
    <Container style={{ justifyContent: "center" }}>
      <Container style={{ alignItems: "center" }}>
        <Text size={24}>Game PIN:</Text>
        <Text size={42}>{game.gameId}</Text>
        <Button color="red" onPress={onInviteFriendsBtnPressed} thin>
          <Text size={14}>Invite Friends</Text>
        </Button>
      </Container>
    </Container>

    <Container style={{ flex: 1, justifyContent: "center" }}>
      <Container style={{ aspectRatio: 1 }}>
        <PlayersList game={game} currUserId={currUserId} />
      </Container>
    </Container>

    <Container
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 24,
        gap: 16,
      }}
    >
      <LeaveGameButton />
      <Container style={{ flex: 1 }}>
        {game.players.includes(currUserId) ? (
          game.host === currUserId ? (
            <StartGameButton gameId={game.gameId} />
          ) : (
            <Text>
              Waiting for {game.usernames[game.host]} to start the game...
            </Text>
          )
        ) : (
          <JoinGameButton gameId={game.gameId} />
        )}
      </Container>
    </Container>
  </KeyboardAvoidingView>
);

export default LobbyScreen;
