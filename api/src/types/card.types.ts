export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardSuit = 'H' | 'D' | 'C' | 'S';
export type CardID = `${CardRank}${CardSuit}`;