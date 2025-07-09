// Game types that match our Rust structs
export interface Card {
  suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
  rank: 'Ace' | 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King';
}

export interface Hand {
  cards: Card[];
}

export interface Player {
  id: string;
  name: string;
  hand: Hand;
  bet: number;
  balance: number;
  is_active: boolean;
}

export type GameState = 'WaitingForPlayers' | 'PlayerTurn' | 'DealerTurn' | 'GameEnd';

export interface BlackjackGame {
  dealer_hand: Hand;
  players: Player[];
  current_player_index: number;
  state: GameState;
}

export type PlayerAction = 'hit' | 'stand' | 'double_down';

export interface GameMessage {
  type: 'game_state' | 'player_joined' | 'player_action' | 'game_started' | 'round_ended';
  payload: BlackjackGame | Player | { playerId: string; action: string } | null;
  playerId?: string;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  gameState: BlackjackGame | null;
  isGameActive: boolean;
}
