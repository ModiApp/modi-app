import { Text } from "@/ui/elements";
import { useCurrentGame } from "../PlayingContext";

export function WinnerInfo() {
  const { game } = useCurrentGame();
  if (game.status !== "ended") return null;

  return (
    <>
      <Text>Winner{game.winners.length > 1 ? "s" : ""}:</Text>
      <Text size={14}>
        {game.winners.map((winner) => game.usernames[winner]).join(", ")}
      </Text>
    </>
  );
}
