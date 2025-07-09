'use client';

import { useState } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import Lobby from '@/components/Lobby';
import GameTable from '@/components/GameTable';

export default function Home() {
  const [inRoom, setInRoom] = useState(false);

  return (
    <GameProvider>
      {inRoom ? (
        <GameTable />
      ) : (
        <Lobby onJoinRoom={() => setInRoom(true)} />
      )}
    </GameProvider>
  );
}
