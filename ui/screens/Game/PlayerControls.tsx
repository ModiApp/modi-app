import type { ActiveGame, Game, InitialGame } from "@/api/src/types";
import { useCurrentCard } from "@/hooks/useCurrentCard";
import { useEndRound } from "@/hooks/useEndRound";
import { useStick } from "@/hooks/useStick";
import { useSwapCards } from "@/hooks/useSwapCards";
import { Button, Container, Text } from "@/ui/elements";
import { DealCardsButton } from "./components/DealCardsButton";
import { GameSettingsButton } from "./components/GameSettingsButton";
import { JoinGameButton } from "./components/JoinGameButton";
import { LeaveGameButton } from "./components/LeaveGameButton";
import { PlayAgainButton } from "./components/PlayAgainButton";
import { StartGameButton } from "./components/StartGameButton";

export function PlayerControls(props: { game: Game; currUserId: string }) {
  const { game, currUserId } = props;
  const currentCard = useCurrentCard(game.gameId);

  if (game.status === "gathering-players") {
    return (
      <>
        <LeaveGameButton />
        <Container style={{ flex: 1, justifyContent: "center" }}>
          {game.players.includes(currUserId) ? (
            game.host === currUserId ? (
              <Container style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <StartGameButton gameId={game.gameId} fullWidth />
                <GameSettingsButton game={game as InitialGame} />
              </Container>
            ) : (
              <Text>
                Waiting for {game.usernames[game.host]} to start the game...
              </Text>
            )
          ) : (
            <JoinGameButton gameId={game.gameId} />
          )}
        </Container>
      </>
    );
  }

  if (game.status === "ended") {
    return (
      <>
        <LeaveGameButton variant="large" />
        <PlayAgainButton gameId={game.gameId} />
      </>
    );
  }

  if (game.roundState === "pre-deal") {
    if (game.dealer === currUserId && game.activePlayer === currUserId) {
      return <DealCardsButton />;
    }
    return (
      <Text>Waiting for {game.usernames[game.dealer]} to deal cards...</Text>
    );
  }

  if (game.roundState === "playing") {
    if (game.activePlayer === currUserId) {
      return (
        <>
          {!currentCard?.startsWith("K") && (
            <SwapCardsButton game={game} currUserId={currUserId} />
          )}
          <StickButton />
        </>
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
  const isDealer = game.dealer === currUserId;
  const label = isDealer ? "Hit Deck" : "Swap";
  const hint = isDealer
    ? "Draw a new card from the deck, revealing your current card"
    : "Exchange your card with the next player";

  return (
    <Button
      color="red"
      onPress={swapCard}
      loading={isSwapping}
      fullWidth
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <Text>{label}</Text>
    </Button>
  );
}

function StickButton() {
  const { stick, isSticking } = useStick();

  return (
    <Button
      color="blue"
      onPress={stick}
      loading={isSticking}
      fullWidth
      accessibilityLabel="Stick"
      accessibilityHint="Keep your current card and end your turn"
    >
      <Text>Stick</Text>
    </Button>
  );
}

function EndRoundButton() {
  const { endRound, isEndingRound } = useEndRound();

  return (
    <Button
      color="blue"
      fullWidth
      onPress={endRound}
      loading={isEndingRound}
      accessibilityLabel="End Round"
      accessibilityHint="Reveal all cards and tally the round scores"
    >
      <Text>End Round</Text>
    </Button>
  );
}
