import { Player as PlayerType } from '@/types/game';
import Hand from './Hand';

interface PlayerComponentProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  canAct: boolean;
  onAction: (action: string) => void;
}

function calculateHandScore(hand: PlayerType['hand']): number {
  let score = 0;
  let aces = 0;

  for (const card of hand.cards) {
    if (card.rank === 'Ace') {
      aces += 1;
      score += 1;
    } else if (['Jack', 'Queen', 'King'].includes(card.rank)) {
      score += 10;
    } else {
      const value = parseInt(card.rank);
      if (!isNaN(value)) {
        score += value;
      }
    }
  }

  // Handle aces
  for (let i = 0; i < aces; i++) {
    if (score + 10 <= 21) {
      score += 10;
    }
  }

  return score;
}

export default function PlayerComponent({ player, isCurrentPlayer, canAct, onAction }: PlayerComponentProps) {
  const handScore = calculateHandScore(player.hand);
  const isBusted = handScore > 21;
  const isBlackjack = player.hand.cards.length === 2 && handScore === 21;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-2 transition-all duration-300 ${
      isCurrentPlayer ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{player.name}</h2>
          <div className="flex space-x-4 text-sm text-gray-600">
            <span>Balance: ${player.balance}</span>
            <span>Bet: ${player.bet}</span>
          </div>
        </div>
        <div className="text-right">
          {isBusted && <div className="text-red-600 font-bold">BUST!</div>}
          {isBlackjack && <div className="text-yellow-600 font-bold">BLACKJACK!</div>}
          {isCurrentPlayer && <div className="text-blue-600 font-semibold">Your Turn</div>}
        </div>
      </div>

      <Hand
        hand={player.hand}
        label=""
        score={handScore}
        isActive={isCurrentPlayer}
      />

      {canAct && isCurrentPlayer && !isBusted && !isBlackjack && (
        <div className="mt-6 flex space-x-3 justify-center">
          <button
            onClick={() => onAction('hit')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Hit
          </button>
          <button
            onClick={() => onAction('stand')}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Stand
          </button>
          {player.hand.cards.length === 2 && player.balance >= player.bet && (
            <button
              onClick={() => onAction('double_down')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Double Down
            </button>
          )}
        </div>
      )}
    </div>
  );
}
