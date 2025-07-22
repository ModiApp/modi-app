import { useShare } from "@/hooks/useShare";
import { Button, Container, Text } from "@/ui/elements";
import { useCurrentGame } from "../PlayingContext";

export function ShareGameInfo() {
  const { game } = useCurrentGame();
  const { shareGame } = useShare();

  if (game.status !== "gathering-players") return null;

  return (
    <Container
      style={{
        alignItems: "center",
      }}
    >
      <Text size={24}>Game PIN:</Text>
      <Text size={42}>{game.gameId}</Text>
      <Button color="red" onPress={() => shareGame(game.gameId)} thin>
        <Text size={14}>Invite Friends</Text>
      </Button>
    </Container>
  );
}
