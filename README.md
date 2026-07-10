# Nexus Grid (Tic Tac Toe)

A clean, responsive Tic Tac Toe game built using vanilla HTML, CSS, and JS. Supports local play, an AI opponent, and real-time multiplayer across tabs on the same device.

## Features
- **3 Game Modes**: 
  - Local Multiplayer (play against a friend next to you)
  - VS Computer AI (Easy, Medium, and Hard difficulty levels)
  - Online Multiplayer (runs locally/same domain using localStorage events)
- **4 Visual Themes**: Classic, Neon, Wooden, and Pastel (persistent via localStorage).
- **Sound Design**: Click, win, draw, and transition sound effects generated using Web Audio API (no external files needed).
- **History & Leaderboards**: Persistent scoreboard showing wins, losses, and recent game results.

## Quick Start
To run locally, you can open `index.html` directly in your browser.

Alternatively, to run with Vite:
1. Make sure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Project Structure
- `index.html` - Home page & theme selection
- `game.html` - Main game board screen
- `rules.html` - Game rules and instructions
- `leaderboard.html` - Leaderboards & match history
- `settings.html` - System preferences
- `css/style.css` - Common UI styles
- `js/`
  - `game.js` - UI rendering & event handlers
  - `game-logic.js` - Board win checking & AI logic
  - `sound.js` - Web Audio sound generator
  - `storage.js` - LocalStorage read/write logic
  - `main.js` - Common bootstrap code
