import { Hand as HandType } from '@/types/game';
import Card from './Card';

interface HandProps {
  hand: HandType;
  label: string;
  score?: number;
  hideFirstCard?: boolean;
  isActive?: boolean;
}

export default function Hand({ hand, label, score, hideFirstCard = false, isActive = false }: HandProps) {
  return (
    <div className={`flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200 ${isActive ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-50'}`}>
      <h3 className={`text-lg font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
        {label} {score !== undefined && `(${score})`}
      </h3>
      <div className="flex space-x-2">
        {hand.cards.map((card, index) => (
          <Card
            key={index}
            card={card}
            hidden={hideFirstCard && index === 0}
            className="transform hover:scale-105 transition-transform duration-200"
          />
        ))}
      </div>
    </div>
  );
}
