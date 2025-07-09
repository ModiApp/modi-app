import { CardBack } from "@/ui/components/Card";
import { Button, Container, ScreenContainer, Text } from "@/ui/elements";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, LayoutChangeEvent } from "react-native";

const mockPlayers = [
  { playerId: "1", username: "Peter" },
  { playerId: "2", username: "Jack" },
  { playerId: "3", username: "Ikey" },
  { playerId: "4", username: "Raquel" },
];

const currUserId = "4";

export default function PlaygroundScreen() {
  const cardsRef = useRef<CardsRef>(null);
  return (
    <ScreenContainer>
      <CardTable>
        <PlayerCircles players={mockPlayers} />
        <Cards dealerId="2" ref={cardsRef} />
      </CardTable>
      <Button
        onPress={() => cardsRef.current?.dealCards(["3", "4", "1", "2"])}
        title="Deal Cards"
        color="red"
        style={{ marginTop: 48 }}
      />
      <Button
        onPress={() => cardsRef.current?.swapCards("3", "4")}
        title="Swap Cards"
        color="blue"
        style={{ marginTop: 16 }}
      />
    </ScreenContainer>
  );
}

type PlayerPosition = { x: number; y: number; rotation: number };

const CardTableContext = createContext<{
  radius: number;
  playerPositions: { [playerId: string]: PlayerPosition };
  setPlayerPositions(positions: { [playerId: string]: PlayerPosition }): void;
}>({ radius: 0, playerPositions: {}, setPlayerPositions: () => {} });
function CardTable(props: React.PropsWithChildren) {
  const [radius, setRadius] = useState(0);
  const [playerPositions, setPlayerPositions] = useState<{
    [playerId: string]: PlayerPosition;
  }>({});
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setRadius(Math.min(width, height) / 2);
  };

  return (
    <Container
      color="lightGreen"
      style={{
        aspectRatio: 1,
        borderRadius: 999,
        maxWidth: 600,
        position: "relative",
      }}
      onLayout={handleLayout}
    >
      <CardTableContext.Provider
        value={{ radius, playerPositions, setPlayerPositions }}
      >
        {React.Children.map(props.children, (child) => (
          <Container
            style={{
              position: "absolute",
              transform: [{ translateX: radius }, { translateY: radius }],
            }}
          >
            {child}
          </Container>
        ))}
      </CardTableContext.Provider>
    </Container>
  );
}

function PlayerCircles(props: {
  players: { playerId: string; username: string }[];
}) {
  const { radius, setPlayerPositions } = useContext(CardTableContext);
  const currentUserIndex = props.players.findIndex(
    (player) => player.playerId === currUserId
  );
  const currentUserAngle = (currentUserIndex * 360) / props.players.length;
  const rotationDegrees = 90 - currentUserAngle;

  const playerCircles = useMemo(
    () =>
      props.players.map((player, index) => {
        const baseAngle = (index * 2 * Math.PI) / props.players.length;
        const rotatedAngle = baseAngle + degreesToRadians(rotationDegrees);
        const x = radius * Math.cos(rotatedAngle);
        const y = radius * Math.sin(rotatedAngle);
        return {
          x,
          y,
          rotation: radiansToDegrees(rotatedAngle) - 90,
          ...player,
        };
      }),
    [props.players, radius, rotationDegrees]
  );

  useEffect(() => {
    setPlayerPositions(
      playerCircles.reduce((acc, { playerId, x, y, rotation }) => {
        acc[playerId] = { x, y, rotation };
        return acc;
      }, {} as { [playerId: string]: PlayerPosition })
    );
  }, [playerCircles, setPlayerPositions]);

  return (
    <>
      {playerCircles.map(({ playerId, username, x, y }) => (
        <Container
          key={playerId}
          color="gray"
          style={{
            position: "absolute",
            borderRadius: 999,
            padding: 16,
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
            transform: [
              { translateX: "-50%" },
              { translateY: "-50%" },
              { translateX: x },
              { translateY: y },
            ],
          }}
        >
          <Text>{playerId}</Text>
        </Container>
      ))}
    </>
  );
}

interface CardsRef {
  dealCards(toPlayers: string[]): void;
  swapCards(fromPlayerId: string, toPlayerId: string): void;
}
const Cards = React.forwardRef<CardsRef, { dealerId: string }>(function Cards(
  { dealerId },
  ref
) {
  const { playerPositions } = useContext(CardTableContext);
  const [deckPosition, setDeckPosition] = useState<PlayerPosition | null>(null);

  const [cardAnimationValues, setCardAnimationValues] = useState<
    {
      x: Animated.Value;
      y: Animated.Value;
      rotation: Animated.Value;
      playerId: string;
    }[]
  >([]);
  const cardDealOrder = useRef<string[]>([]);
  const cardPositions = useRef<{ x: number; y: number; rotation: number }[]>(
    []
  );

  const dealCards = useCallback(
    (toPlayers: string[]) => {
      if (!deckPosition) {
        console.warn("No deck position set");
        return;
      }

      console.log("dealing cards to players", toPlayers);

      cardDealOrder.current = [...toPlayers];

      // Initialize and draw all the cards at the start position, on top of the deck
      const startingAnimationValues = toPlayers.map((playerId) => {
        return {
          x: new Animated.Value(deckPosition.x),
          y: new Animated.Value(deckPosition.y),
          rotation: new Animated.Value(deckPosition.rotation),
          playerId,
        };
      });
      setCardAnimationValues(startingAnimationValues);

      const animations = startingAnimationValues.map((value, index) => {
        const toXValue =
          playerPositions[toPlayers[index]].x +
          Math.cos(
            degreesToRadians(playerPositions[toPlayers[index]].rotation - 90)
          ) *
            80;
        const toYValue =
          playerPositions[toPlayers[index]].y +
          Math.sin(
            degreesToRadians(playerPositions[toPlayers[index]].rotation - 90)
          ) *
            80;
        const toRotationValue = playerPositions[toPlayers[index]].rotation;

        cardPositions.current.push({
          x: toXValue,
          y: toYValue,
          rotation: toRotationValue,
        });

        return Animated.parallel([
          Animated.timing(value.x, {
            // I want the card to be like 150px away from the player, towards the center of the table
            toValue: toXValue,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(value.y, {
            toValue: toYValue,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(value.rotation, {
            toValue: toRotationValue,
            duration: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(300, animations).start();
    },
    [playerPositions, deckPosition, cardPositions]
  );

  const swapCards = useCallback(
    (player1: string, player2: string) => {
      const player1Index = cardDealOrder.current.indexOf(player1);
      const player1CardPosition = cardPositions.current[player1Index];
      const player1CardAnimationValue = cardAnimationValues[player1Index];

      const player2Index = cardDealOrder.current.indexOf(player2);
      const player2CardPosition = cardPositions.current[player2Index];
      const player2CardAnimationValue = cardAnimationValues[player2Index];

      console.log({
        cardDealOrder: [...cardDealOrder.current],
        player1Index,
        player1CardPosition,
        player1CardAnimationValue,
        player2Index,
        player2CardPosition,
        player2CardAnimationValue,
      });

      Animated.parallel([
        Animated.parallel([
          Animated.timing(player1CardAnimationValue.x, {
            toValue: player2CardPosition.x,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(player1CardAnimationValue.y, {
            toValue: player2CardPosition.y,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(player1CardAnimationValue.rotation, {
            toValue: player2CardPosition.rotation,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(player2CardAnimationValue.x, {
            toValue: player1CardPosition.x,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(player2CardAnimationValue.y, {
            toValue: player1CardPosition.y,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(player2CardAnimationValue.rotation, {
            toValue: player1CardPosition.rotation,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      cardDealOrder.current[player1Index] = player2;
      cardDealOrder.current[player2Index] = player1;
    },
    [cardAnimationValues, cardPositions]
  );

  useImperativeHandle(
    ref,
    () => ({
      dealCards,
      swapCards,
    }),
    [dealCards, swapCards]
  );

  return (
    <>
      {Boolean(playerPositions[dealerId]) && (
        <CardDeck dealerId={dealerId} onLayout={setDeckPosition} />
      )}
      {cardAnimationValues.map((value, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            transform: [
              { translateX: "-50%" },
              { translateY: "-50%" },
              { translateX: value.x },
              { translateY: value.y },
              {
                rotate: value.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <CardBack />
        </Animated.View>
      ))}
    </>
  );
});

function CardDeck(props: {
  dealerId: string;
  onLayout: (pos: PlayerPosition) => void;
}) {
  const { dealerId, onLayout } = props;
  const { playerPositions } = useContext(CardTableContext);

  useEffect(() => {
    if (!playerPositions[dealerId]) return;
    const x =
      playerPositions[dealerId].x +
      Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) * 100;
    const y =
      playerPositions[dealerId].y +
      Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) * 100;
    onLayout({
      x,
      y,
      rotation: playerPositions[dealerId].rotation,
    });
  }, [playerPositions, onLayout, dealerId]);

  if (!playerPositions[dealerId]) {
    return null;
  }

  const translateX =
    playerPositions[dealerId].x +
    Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) * 100;
  const translateY =
    playerPositions[dealerId].y +
    Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) * 100;

  return (
    <CardBack
      style={{
        // transformOrigin: "center",
        transform: [
          { translateX: "-50%" },
          { translateY: "-50%" },
          { translateY },
          { translateX },
          { rotate: `${playerPositions[dealerId].rotation}deg` },
        ],
      }}
    />
  );
}

/**
 * I'm trying to come up with a way to position the players in a circle.
 * In such a way that the position of the current user is always at the bottom.
 * Also I'd like for the player circles to be able to communicate their positions to a parent context.
 * Where sibling components can use this context to layer in other elements relative to the player circles.
 */

function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI);
}
function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
