"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Player } from "@/types/game";
import PlayerComponent from "@/components/Player";
import Hand from "@/components/Hand";

// Import the WASM module
let GameEngine: typeof import("@/wasm/blackjack_game").GameEngine | null = null;
let gameEngine: InstanceType<
  typeof import("@/wasm/blackjack_game").GameEngine
> | null = null;

export default function GameTable() {
  const { roomState, isConnected, performAction, startNewRound } = useGame();
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [syncedPlayers, setSyncedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load WASM module
    const loadWasm = async () => {
      try {
        const wasmModule = await import("@/wasm/blackjack_game");

        // Initialize the WASM module first
        await wasmModule.default();

        GameEngine = wasmModule.GameEngine;
        gameEngine = new GameEngine();
        setWasmLoaded(true);
        console.log("WASM module loaded successfully");
      } catch (error) {
        console.error("Failed to load WASM module:", error);
        console.error("Error details:", error);
      }
    };

    loadWasm();

    // Cleanup function
    return () => {
      if (gameEngine) {
        try {
          gameEngine.free();
          gameEngine = null;
        } catch (error) {
          console.warn("Error cleaning up WASM engine:", error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (wasmLoaded && gameEngine && roomState.gameState) {
      try {
        // Sync with local game engine - only add new players
        console.log("Syncing with WASM game engine...");

        // Add only new players to WASM engine
        for (const player of roomState.gameState.players) {
          if (!syncedPlayers.has(player.id)) {
            try {
              const success = gameEngine.add_player(
                player.id,
                player.name,
                player.balance
              );
              if (success) {
                setSyncedPlayers((prev) => new Set(prev).add(player.id));
                console.log(`Added player ${player.name} to WASM engine`);
              }
            } catch (playerError) {
              console.warn(
                `Failed to add player ${player.name} to WASM:`,
                playerError
              );
            }
          }
        }

        // Only get game state if we're not in the middle of another operation
        if (gameEngine) {
          setTimeout(() => {
            try {
              const state = gameEngine?.get_game_state();
              if (state) {
                console.log("Game state from WASM:", state);
              }
            } catch (stateError) {
              console.warn("Error getting WASM game state:", stateError);
            }
          }, 0);
        }
      } catch (error) {
        console.error("Error syncing with WASM game engine:", error);
      }
    }
  }, [wasmLoaded, roomState.gameState, syncedPlayers]);

  const handlePlayerAction = (action: string) => {
    // Try to process action with WASM engine first
    if (wasmLoaded && gameEngine && roomState.gameState) {
      try {
        // Use setTimeout to avoid recursive calls
        setTimeout(() => {
          try {
            const currentPlayerId = gameEngine?.get_current_player_id();
            if (currentPlayerId && gameEngine) {
              gameEngine.player_action(currentPlayerId, action);
              console.log(
                `WASM processed action: ${action} for player: ${currentPlayerId}`
              );
            }
          } catch (actionError) {
            console.warn("WASM action processing failed:", actionError);
          }
        }, 0);
      } catch (error) {
        console.warn("WASM action setup failed, using server fallback:", error);
      }
    }

    // Always send to server for multiplayer sync
    performAction(action);
  };

  const handleStartNewRound = () => {
    // Try to start new round with WASM engine
    if (wasmLoaded && gameEngine) {
      try {
        // Use setTimeout to avoid recursive calls
        setTimeout(() => {
          try {
            gameEngine?.start_new_round();
            console.log("WASM started new round");
          } catch (roundError) {
            console.warn("WASM new round failed:", roundError);
          }
        }, 0);
      } catch (error) {
        console.warn(
          "WASM new round setup failed, using server fallback:",
          error
        );
      }
    }

    // Always send to server for multiplayer sync
    startNewRound();
  };

  const calculateHandScore = (hand: {
    cards: Array<{ rank: string }>;
  }): number => {
    if (!hand || !hand.cards) return 0;

    // Use WASM calculation if available, otherwise fallback to JS
    if (wasmLoaded && gameEngine) {
      try {
        // Note: In a real implementation, you'd want to pass the hand to WASM
        // For now, we'll use the JS fallback since the WASM hand structure is different
      } catch (error) {
        console.warn("WASM score calculation failed, using fallback:", error);
      }
    }

    // JavaScript fallback calculation
    let score = 0;
    let aces = 0;

    for (const card of hand.cards) {
      if (card.rank === "Ace") {
        aces += 1;
        score += 1;
      } else if (["Jack", "Queen", "King"].includes(card.rank)) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to Play!
          </h2>
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
  let currentPlayerId: string | undefined;

  // Safely get current player ID
  try {
    currentPlayerId =
      wasmLoaded && gameEngine ? gameEngine.get_current_player_id() : undefined;
  } catch (error) {
    console.warn("Error getting current player ID from WASM:", error);
    currentPlayerId = undefined;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Blackjack Table
          </h1>
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
              score={
                gameState.state === "DealerTurn" ||
                gameState.state === "GameEnd"
                  ? calculateHandScore(gameState.dealer_hand)
                  : undefined
              }
              hideFirstCard={gameState.state === "PlayerTurn"}
            />
          </div>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gameState.players.map((player: Player) => (
            <PlayerComponent
              key={player.id}
              player={player}
              isCurrentPlayer={
                player.id === currentPlayerId &&
                gameState.state === "PlayerTurn"
              }
              canAct={gameState.state === "PlayerTurn"}
              onAction={handlePlayerAction}
            />
          ))}
        </div>

        {/* Game Controls */}
        <div className="text-center">
          {gameState.state === "GameEnd" && (
            <button
              onClick={handleStartNewRound}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start New Round
            </button>
          )}

          <div className="mt-4 text-white">Game State: {gameState.state}</div>
        </div>
      </div>
    </div>
  );
}
