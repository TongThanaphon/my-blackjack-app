# Blackjack Online 🃏

This is vipe code by copilot. A real-time multiplayer Blackjack game built with modern web technologies:

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Game Logic**: Rust compiled to WebAssembly for high performance
- **Real-time Communication**: WebSocket integration for live gameplay
- **State Management**: React hooks and context for game state

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (latest stable)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Build the Rust WebAssembly module:

```bash
npm run build:wasm
```

3. Start both the WebSocket server and the Next.js frontend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Start the WebSocket server
npm run server:dev

# Terminal 2: Start the Next.js frontend
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to play the game!

## 🎮 How to Play

1. **Enter your name** and **create or join a room** using a room ID
2. **Wait for other players** to join (up to 6 players per room)
3. **Start a new round** when ready
4. **Place your bets** and make your moves:
   - **Hit**: Take another card
   - **Stand**: Keep your current hand
   - **Double Down**: Double your bet and take one final card
5. **Beat the dealer** by getting closer to 21 without going over!

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)

- React components for game UI
- Real-time WebSocket communication
- Responsive design with Tailwind CSS
- TypeScript for type safety

### Game Logic (Rust + WebAssembly)

- High-performance card dealing and shuffling
- Accurate game rule implementation
- Score calculation and game state management
- Compiled to WebAssembly for near-native performance

### Real-time Server (Node.js + Socket.IO)

- WebSocket server for live multiplayer functionality
- Room management and player synchronization
- Game state broadcasting
- RESTful health check endpoint

## 📁 Project Structure

```
my-blackjack-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── contexts/           # React context providers
│   ├── types/              # TypeScript type definitions
│   └── wasm/               # Generated WebAssembly files
├── wasm-game/              # Rust game logic source
│   ├── src/
│   │   └── lib.rs          # Main Rust game engine
│   └── Cargo.toml         # Rust dependencies
├── server/                 # WebSocket server
│   ├── server.js           # Express + Socket.IO server
│   └── package.json        # Server dependencies
└── README.md
```

## 🔧 Available Scripts

| Command                | Description                                 |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start Next.js development server            |
| `npm run build`        | Build Next.js for production                |
| `npm run start`        | Start Next.js production server             |
| `npm run build:wasm`   | Compile Rust to WebAssembly                 |
| `npm run server:dev`   | Start WebSocket server in development       |
| `npm run server:start` | Start WebSocket server in production        |
| `npm run dev:all`      | Start both server and frontend concurrently |

## 🌐 API Endpoints

### WebSocket Events

#### Client → Server

- `join_room` - Join a game room
- `leave_room` - Leave the current room
- `start_round` - Start a new game round
- `player_action` - Perform game action (hit, stand, double_down)
- `place_bet` - Place a bet for the round

#### Server → Client

- `room_state` - Current room and game state
- `game_message` - Game events and updates
- `error` - Error messages

### REST API

- `GET /health` - Server health check

## 🚀 Deployment

### Frontend (Vercel)

```bash
npm run build
```

Deploy the `out/` directory to your preferred hosting platform.

### Server (Railway/Heroku)

The WebSocket server can be deployed to any Node.js hosting platform:

```bash
cd server
npm install
npm start
```

## 🛠️ Development

### Adding New Features

1. **Game Logic**: Modify `wasm-game/src/lib.rs` and rebuild with `npm run build:wasm`
2. **UI Components**: Add React components in `src/components/`
3. **Server Logic**: Update `server/server.js` for new WebSocket events
4. **Types**: Update `src/types/game.ts` for TypeScript definitions

### Testing

The game includes basic error handling and validation. For production deployment, consider adding:

- Unit tests for Rust game logic
- Integration tests for WebSocket communication
- E2E tests for user interactions

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
