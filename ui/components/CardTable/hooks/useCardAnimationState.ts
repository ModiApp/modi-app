// import { useRef, useState } from "react";
// import { CardAnimationValue, CardPosition } from "../types";

// export function useCardAnimationState() {
//   const [cardAnimationValues, setCardAnimationValues] = useState<CardAnimationValue[]>([]);
//   const cardDealOrder = useRef<string[]>([]);
//   const cardPositions = useRef<CardPosition[]>([]);

//   const resetState = () => {
//     setCardAnimationValues([]);
//     cardDealOrder.current = [];
//     cardPositions.current = [];
//   };

//   return {
//     cardAnimationValues,
//     setCardAnimationValues,
//     cardDealOrder,
//     cardPositions,
//     resetState,
//   };
// } 