import { useDealCards } from "@/hooks/useDealCards";
import { Button } from "@/ui/elements";

export function DealCardsButton() {
  const { dealCards, isDealing } = useDealCards();
  return (
    <Button
      color="blue"
      title="Deal Cards"
      onPress={dealCards}
      loading={isDealing}
      fullWidth
      accessibilityHint="Deal one card to each player to start the round"
    />
  );
}
