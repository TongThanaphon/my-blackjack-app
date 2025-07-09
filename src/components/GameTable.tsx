'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Player } from '@/types/game';
import PlayerComponent from '@/components/Player';
import Hand from '@/components/Hand';

// Import the WASM module
let GameEngine: typeof import('@/wasm/blackjack_game').GameEngine | null = null;
let gameEngine: InstanceType<typeof import('@/wasm/blackjack_game').GameEngine> | null = null;

export default function GameTable() {
  const { roomState, isConnected, performAction, startNewRound } = useGame();
  const [wasmLoaded, setWasmLoaded] = useState(false);

  useEffect(() => {
    // Load WASM module
    const loadWasm = async () => {
      try {
        const wasmModule = await import('@/wasm/blackjack_game');
        GameEngine = wasmModule.GameEngine;
        gameEngine = new GameEngine();
        setWasmLoaded(true);
        console.log('WASM module loaded successfully');
      } catch (error) {
        console.error('Failed to load WASM module:', error);
      }
    };

    loadWasm();
  }, []);

  useEffect(() => {
    if (wasmLoaded && gameEngine && roomState.gameState) {
      try {
        // Sync with local game engine
        const state = gameEngine.get_game_state();
        console.log('Game state from WASM:', state);
      } catch (error) {
        console.error('Error getting game state from WASM:', error);
      }
    }
  }, [wasmLoaded, roomState.gameState]);

  const handlePlayerAction = (action: string) => {
    performAction(action);
  };

  const handleStartNewRound = () => {
    startNewRound();
  };

  const calculateHandScore = (hand: { cards: Array<{ rank: string }> }): number => {
    if (!hand || !hand.cards) return 0;
    
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
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-green-600">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  if (!wasmLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-green-600">
        <div className="text-white text-xl">Loading game engine...</div>
      </div>
    );
  }

  if (!roomState.gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-green-600">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Play!</h2>
          <p className="text-gray-600 mb-6">Waiting for game to start...</p>
          <button
            onClick={handleStartNewRound}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Start New Round
          </button>
        </div>
      </div>
    );
  }

  const gameState = roomState.gameState;
  const currentPlayerId = gameEngine?.get_current_player_id?.();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Blackjack Table</h1>
          <div className="text-green-200">
            Room: {roomState.roomId} | Players: {gameState.players.length}
          </div>
        </div>

        {/* Dealer Section */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Hand
              hand={gameState.dealer_hand}
              label="Dealer"
              score={gameState.state === 'DealerTurn' || gameState.state === 'GameEnd' 
                ? calculateHandScore(gameState.dealer_hand) 
                : undefined
              }
              hideFirstCard={gameState.state === 'PlayerTurn'}
            />
          </div>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gameState.players.map((player: Player) => (
            <PlayerComponent
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId && gameState.state === 'PlayerTurn'}
              canAct={gameState.state === 'PlayerTurn'}
              onAction={handlePlayerAction}
            />
          ))}
        </div>

        {/* Game Controls */}
        <div className="text-center">
          {gameState.state === 'GameEnd' && (
            <button
              onClick={handleStartNewRound}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start New Round
            </button>
          )}
          
          <div className="mt-4 text-white">
            Game State: {gameState.state}
          </div>
        </div>
      </div>
    </div>
  );
}
