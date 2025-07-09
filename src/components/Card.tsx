import { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  hidden?: boolean;
  className?: string;
}

const suitSymbols = {
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣',
  Spades: '♠',
};

const suitColors = {
  Hearts: 'text-red-500',
  Diamonds: 'text-red-500',
  Clubs: 'text-black',
  Spades: 'text-black',
};

const rankDisplays = {
  Ace: 'A',
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
  Jack: 'J',
  Queen: 'Q',
  King: 'K',
};

export default function Card({ card, hidden = false, className = '' }: CardProps) {
  if (hidden) {
    return (
      <div className={`w-16 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${className}`}>
        <div className="w-8 h-8 bg-blue-300 rounded-full opacity-50"></div>
      </div>
    );
  }

  return (
    <div className={`w-16 h-24 bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col justify-between p-1 ${className}`}>
      <div className={`text-sm font-bold ${suitColors[card.suit]} flex flex-col items-center`}>
        <span>{rankDisplays[card.rank]}</span>
        <span className="text-xs">{suitSymbols[card.suit]}</span>
      </div>
      <div className={`text-2xl ${suitColors[card.suit]} flex justify-center items-center flex-1`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-sm font-bold ${suitColors[card.suit]} flex flex-col items-center rotate-180`}>
        <span>{rankDisplays[card.rank]}</span>
        <span className="text-xs">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
}
