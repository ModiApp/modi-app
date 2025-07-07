import { ActiveGame } from "@/functions/src/types";
import { Button, Container, Text } from "@/ui/elements";

export function PlayerControls(props: {
  game: ActiveGame;
  currUserId: string;
}) {
  const { game, currUserId } = props;

  if (game.roundState === "pre-deal") {
    if (game.dealer === currUserId && game.activePlayer === currUserId) {
      return (
        <Button color="blue" onPress={() => {}}>
          <Text>Deal Cards</Text>
        </Button>
      );
    }
  }

  return (
    <Container
      color="gray"
      style={{
        padding: 16,
        borderRadius: 8,
        marginTop: "auto",
      }}
    >
      <Text style={{ fontSize: 14, textAlign: "center" }}>
        Game is active - waiting for game logic implementation
      </Text>
    </Container>
  );
}
