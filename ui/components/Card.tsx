import { CardID } from "@/functions/src/types";
import cardImgs from "@/ui/assets/images/cards";
import React from "react";
import { Image, ImageProps, ImageStyle } from "react-native";

interface CardProps {
  cardId: CardID | null;
  style?: ImageStyle;
  width?: number;
  height?: number;
}

/**
 * Converts a CardID (e.g., "2H", "AS", "KC") to the image format used in cardImgs
 */
function cardIdToImage(cardId: CardID): any {
  const rank = cardId.slice(0, -1); // Everything except the last character
  const suit = cardId.slice(-1); // Last character

  // Convert rank to number
  let rankNum: number;
  switch (rank) {
    case "A":
      rankNum = 1;
      break;
    case "J":
      rankNum = 11;
      break;
    case "Q":
      rankNum = 12;
      break;
    case "K":
      rankNum = 13;
      break;
    default:
      rankNum = parseInt(rank, 10);
      break;
  }

  // Convert suit to image key
  let suitKey: keyof typeof cardImgs;
  switch (suit) {
    case "H":
      suitKey = "hearts";
      break;
    case "D":
      suitKey = "diamonds";
      break;
    case "C":
      suitKey = "clubs";
      break;
    case "S":
      suitKey = "spades";
      break;
    default:
      throw new Error(`Invalid suit: ${suit}`);
  }

  return cardImgs[suitKey][rankNum as keyof (typeof cardImgs)[typeof suitKey]];
}

export function Card({ cardId, style, width = 80, height = 120 }: CardProps) {
  if (!cardId) {
    return null; // Show nothing if no card
  }

  try {
    const cardImage = cardIdToImage(cardId);

    return (
      <Image
        source={cardImage}
        style={[
          {
            width,
            height,
            resizeMode: "contain",
          },
          style,
        ]}
      />
    );
  } catch (error) {
    console.error("Card: Error rendering card", cardId, error);
    return null; // Fail silently
  }
}

export function CardBack({
  style,
  width = 80,
  height = 120,
  ...props
}: ImageProps) {
  return (
    <Image
      source={cardImgs.back}
      {...props}
      style={[
        style,
        {
          width,
          height,
          resizeMode: "contain",
        },
      ]}
    />
  );
}
