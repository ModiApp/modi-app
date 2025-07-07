import { ActiveGame } from "@/functions/src/types";
import { useDealCards } from "@/hooks/useDealCards";
import { useEndRound } from "@/hooks/useEndRound";
import { useStick } from "@/hooks/useStick";
import { useSwapCards } from "@/hooks/useSwapCards";
import { Button, Container, Text } from "@/ui/elements";

export function PlayerControls(props: {
  game: ActiveGame;
  currUserId: string;
}) {
  const { game, currUserId } = props;
  const { dealCards, isDealing } = useDealCards();

  if (game.roundState === "pre-deal") {
    if (game.dealer === currUserId && game.activePlayer === currUserId) {
      return (
        <Button color="blue" onPress={dealCards} loading={isDealing}>
          <Text>Deal Cards</Text>
        </Button>
      );
    }
    return <Text>Waiting for dealer to deal cards...</Text>;
  }

  if (game.roundState === "playing") {
    if (game.activePlayer === currUserId) {
      return (
        <Container style={{ flexDirection: "row", gap: 16, width: "100%" }}>
          <SwapCardsButton game={game} currUserId={currUserId} />
          <StickButton />
        </Container>
      );
    }
    return (
      <Text>It&apos;s {game.usernames[game.activePlayer]}&apos;s turn</Text>
    );
  }

  if (game.roundState === "tallying") {
    if (game.dealer === currUserId) {
      return <EndRoundButton />;
    }
    return (
      <Text>Waiting for {game.usernames[game.dealer]} to end the round...</Text>
    );
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

function SwapCardsButton(props: { game: ActiveGame; currUserId: string }) {
  const { game, currUserId } = props;
  const { swapCard, isSwapping } = useSwapCards();

  return (
    <Button color="red" onPress={swapCard} loading={isSwapping} fullWidth>
      <Text>{game.dealer === currUserId ? "Hit Deck" : "Swap"}</Text>
    </Button>
  );
}

function StickButton() {
  const { stick, isSticking } = useStick();

  return (
    <Button color="blue" onPress={stick} loading={isSticking} fullWidth>
      <Text>Stick</Text>
    </Button>
  );
}

function EndRoundButton() {
  const { endRound, isEndingRound } = useEndRound();

  return (
    <Button color="blue" fullWidth onPress={endRound} loading={isEndingRound}>
      <Text>End Round</Text>
    </Button>
  );
}
