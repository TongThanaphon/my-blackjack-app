const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game state management
const rooms = new Map();

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = new Map();
    this.gameState = null;
    this.isGameActive = false;
    this.maxPlayers = 6;
  }

  addPlayer(playerId, playerName, socket) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }

    const player = {
      id: playerId,
      name: playerName,
      hand: { cards: [] },
      bet: 0,
      balance: 1000, // Starting balance
      is_active: true,
      socket: socket
    };

    this.players.set(playerId, player);
    return true;
  }

  removePlayer(playerId) {
    return this.players.delete(playerId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  toClientState() {
    const players = Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      hand: player.hand,
      bet: player.bet,
      balance: player.balance,
      is_active: player.is_active
    }));

    return {
      roomId: this.roomId,
      players: players,
      gameState: this.gameState,
      isGameActive: this.isGameActive
    };
  }

  broadcast(event, data, excludePlayerId = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.socket) {
        player.socket.emit(event, data);
      }
    });
  }

  startNewRound() {
    if (this.players.size === 0) return false;

    // Create a simple game state for demonstration
    // In a real implementation, this would use the WASM game engine
    this.gameState = {
      dealer_hand: { cards: [] },
      players: Array.from(this.players.values()).map(player => ({
        id: player.id,
        name: player.name,
        hand: { cards: [] },
        bet: player.bet || 10,
        balance: player.balance,
        is_active: true
      })),
      current_player_index: 0,
      state: 'PlayerTurn'
    };

    // Deal initial cards (simplified)
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

    // Deal 2 cards to each player and dealer
    for (let i = 0; i < 2; i++) {
      this.gameState.players.forEach(player => {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        player.hand.cards.push({ suit, rank });
      });

      // Deal to dealer
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      this.gameState.dealer_hand.cards.push({ suit, rank });
    }

    this.isGameActive = true;
    return true;
  }

  handlePlayerAction(playerId, action) {
    if (!this.gameState || this.gameState.state !== 'PlayerTurn') {
      return false;
    }

    const currentPlayer = this.gameState.players[this.gameState.current_player_index];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return false;
    }

    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

    switch (action) {
      case 'hit':
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        currentPlayer.hand.cards.push({ suit, rank });
        
        // Check if busted (simplified scoring)
        const score = this.calculateScore(currentPlayer.hand);
        if (score > 21) {
          currentPlayer.is_active = false;
          this.nextPlayer();
        }
        break;

      case 'stand':
        currentPlayer.is_active = false;
        this.nextPlayer();
        break;

      case 'double_down':
        if (currentPlayer.hand.cards.length === 2) {
          const suit = suits[Math.floor(Math.random() * suits.length)];
          const rank = ranks[Math.floor(Math.random() * ranks.length)];
          currentPlayer.hand.cards.push({ suit, rank });
          currentPlayer.bet *= 2;
          currentPlayer.is_active = false;
          this.nextPlayer();
        }
        break;
    }

    return true;
  }

  nextPlayer() {
    let nextIndex = this.gameState.current_player_index + 1;
    
    while (nextIndex < this.gameState.players.length) {
      if (this.gameState.players[nextIndex].is_active) {
        this.gameState.current_player_index = nextIndex;
        return;
      }
      nextIndex++;
    }

    // No more active players, move to dealer turn
    this.gameState.state = 'DealerTurn';
    this.dealerPlay();
  }

  dealerPlay() {
    // Dealer hits on 16, stands on 17
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

    while (this.calculateScore(this.gameState.dealer_hand) < 17) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      this.gameState.dealer_hand.cards.push({ suit, rank });
    }

    this.gameState.state = 'GameEnd';
    this.isGameActive = false;
  }

  calculateScore(hand) {
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
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, playerName }) => {
    console.log(`${playerName} joining room: ${roomId}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }

    const room = rooms.get(roomId);
    
    // Add player to room
    if (room.addPlayer(socket.id, playerName, socket)) {
      socket.join(roomId);
      socket.roomId = roomId;

      // Send room state to all players
      const roomState = room.toClientState();
      io.to(roomId).emit('room_state', roomState);

      // Notify others that a player joined
      socket.to(roomId).emit('game_message', {
        type: 'player_joined',
        payload: {
          id: socket.id,
          name: playerName,
          hand: { cards: [] },
          bet: 0,
          balance: 1000,
          is_active: true
        }
      });

      console.log(`${playerName} joined room ${roomId}. Players: ${room.getPlayerCount()}`);
    } else {
      socket.emit('error', { message: 'Room is full' });
    }
  });

  socket.on('leave_room', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        socket.leave(socket.roomId);
        
        // Clean up empty rooms
        if (room.getPlayerCount() === 0) {
          rooms.delete(socket.roomId);
        } else {
          // Update remaining players
          const roomState = room.toClientState();
          io.to(socket.roomId).emit('room_state', roomState);
        }
      }
      socket.roomId = null;
    }
  });

  socket.on('start_round', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room && room.startNewRound()) {
        const roomState = room.toClientState();
        io.to(socket.roomId).emit('room_state', roomState);
        io.to(socket.roomId).emit('game_message', {
          type: 'game_started',
          payload: roomState.gameState
        });
      }
    }
  });

  socket.on('player_action', ({ action }) => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room && room.handlePlayerAction(socket.id, action)) {
        const roomState = room.toClientState();
        io.to(socket.roomId).emit('room_state', roomState);
        io.to(socket.roomId).emit('game_message', {
          type: 'player_action',
          payload: { playerId: socket.id, action },
          playerId: socket.id
        });
      }
    }
  });

  socket.on('place_bet', ({ amount }) => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const player = room.players.get(socket.id);
        if (player && player.balance >= amount) {
          player.bet = amount;
          player.balance -= amount;
          
          const roomState = room.toClientState();
          io.to(socket.roomId).emit('room_state', roomState);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        if (room.getPlayerCount() === 0) {
          rooms.delete(socket.roomId);
        } else {
          const roomState = room.toClientState();
          io.to(socket.roomId).emit('room_state', roomState);
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Blackjack server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
