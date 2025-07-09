# Copilot Instructions for Blackjack App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a real-time multiplayer Blackjack game with:

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Game Logic**: Rust compiled to WebAssembly for high performance
- **Real-time Communication**: WebSocket integration for live gameplay
- **State Management**: React hooks and context for game state

## Architecture Guidelines

1. **Rust/WASM**: All core game logic, card dealing, score calculation in Rust
2. **Next.js Frontend**: UI components, user interactions, and state display
3. **WebSockets**: Real-time communication between players
4. **Type Safety**: Use TypeScript throughout for better development experience

## Coding Standards

- Use functional components with hooks
- Implement proper error handling for WASM integration
- Follow Rust best practices for game logic
- Use Tailwind CSS for styling with mobile-first approach
- Implement proper WebSocket connection management

## Key Features to Implement

- Card dealing and shuffling in Rust
- Player actions (hit, stand, double down, split)
- Real-time multiplayer support
- Game state synchronization
- Responsive UI design
