'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameMessage, RoomState, BlackjackGame, Player } from '@/types/game';

interface GameContextType {
  roomState: RoomState;
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  performAction: (action: string) => void;
  startNewRound: () => void;
  placeBet: (amount: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameState {
  roomState: RoomState;
  socket: Socket | null;
  isConnected: boolean;
}

type GameAction =
  | { type: 'SET_SOCKET'; payload: Socket }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'UPDATE_ROOM_STATE'; payload: Partial<RoomState> }
  | { type: 'SET_GAME_STATE'; payload: BlackjackGame }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'RESET_ROOM' };

const initialState: GameState = {
  roomState: {
    roomId: '',
    players: [],
    gameState: null,
    isGameActive: false,
  },
  socket: null,
  isConnected: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'UPDATE_ROOM_STATE':
      return {
        ...state,
        roomState: { ...state.roomState, ...action.payload },
      };
    case 'SET_GAME_STATE':
      return {
        ...state,
        roomState: { ...state.roomState, gameState: action.payload },
      };
    case 'ADD_PLAYER':
      return {
        ...state,
        roomState: {
          ...state.roomState,
          players: [...state.roomState.players, action.payload],
        },
      };
    case 'RESET_ROOM':
      return {
        ...state,
        roomState: initialState.roomState,
      };
    default:
      return state;
  }
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    dispatch({ type: 'SET_SOCKET', payload: socket });

    socket.on('connect', () => {
      console.log('Connected to server');
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    socket.on('game_message', (message: GameMessage) => {
      console.log('Received game message:', message);
      
      switch (message.type) {
        case 'game_state':
          if (message.payload && typeof message.payload === 'object' && 'dealer_hand' in message.payload) {
            dispatch({ type: 'SET_GAME_STATE', payload: message.payload as BlackjackGame });
          }
          break;
        case 'player_joined':
          if (message.payload && typeof message.payload === 'object' && 'id' in message.payload) {
            dispatch({ type: 'ADD_PLAYER', payload: message.payload as Player });
          }
          break;
        case 'game_started':
          dispatch({ 
            type: 'UPDATE_ROOM_STATE', 
            payload: { isGameActive: true } 
          });
          break;
        case 'round_ended':
          dispatch({ 
            type: 'UPDATE_ROOM_STATE', 
            payload: { isGameActive: false } 
          });
          break;
      }
    });

    socket.on('room_state', (roomState: RoomState) => {
      dispatch({ type: 'UPDATE_ROOM_STATE', payload: roomState });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string, playerName: string) => {
    if (state.socket) {
      state.socket.emit('join_room', { roomId, playerName });
      dispatch({ type: 'UPDATE_ROOM_STATE', payload: { roomId } });
    }
  };

  const leaveRoom = () => {
    if (state.socket) {
      state.socket.emit('leave_room', { roomId: state.roomState.roomId });
      dispatch({ type: 'RESET_ROOM' });
    }
  };

  const performAction = (action: string) => {
    if (state.socket && state.roomState.roomId) {
      state.socket.emit('player_action', {
        roomId: state.roomState.roomId,
        action,
      });
    }
  };

  const startNewRound = () => {
    if (state.socket && state.roomState.roomId) {
      state.socket.emit('start_round', {
        roomId: state.roomState.roomId,
      });
    }
  };

  const placeBet = (amount: number) => {
    if (state.socket && state.roomState.roomId) {
      state.socket.emit('place_bet', {
        roomId: state.roomState.roomId,
        amount,
      });
    }
  };

  const value: GameContextType = {
    roomState: state.roomState,
    socket: state.socket,
    isConnected: state.isConnected,
    joinRoom,
    leaveRoom,
    performAction,
    startNewRound,
    placeBet,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
