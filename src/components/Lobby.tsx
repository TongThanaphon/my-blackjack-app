'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';

interface LobbyProps {
  onJoinRoom: () => void;
}

export default function Lobby({ onJoinRoom }: LobbyProps) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const { joinRoom, isConnected } = useGame();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && playerName.trim()) {
      joinRoom(roomId.trim(), playerName.trim());
      onJoinRoom();
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Blackjack Online</h1>
          <p className="text-gray-600">Join a room to start playing!</p>
          <div className={`mt-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter room ID"
                required
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isConnected || !roomId.trim() || !playerName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
          >
            Join Room
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">How to Play:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Get as close to 21 as possible without going over</li>
            <li>• Face cards are worth 10, Aces are 1 or 11</li>
            <li>• Hit to take another card, Stand to keep your hand</li>
            <li>• Double Down to double your bet and take one more card</li>
            <li>• Beat the dealer to win!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
