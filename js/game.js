// Main game state, UI rendering, flow control, online sync, chat, and event bindings.

const GameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: false,
    gameMode: null, // 'pvp', 'pvc', 'online'
    computerDifficulty: 'medium', // 'easy', 'medium', 'hard'
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    roomCode: null,
    isOnlineHost: false,
    onlineOpponentConnected: false,
    gameHistory: [],
    scoreboard: {},
};

function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.innerHTML = '';
        cell.classList.remove('disabled', 'winning-cell');

        if (GameState.board[index] === 'X') {
            cell.appendChild(createXSymbol());
            cell.classList.add('disabled');
        } else if (GameState.board[index] === 'O') {
            cell.appendChild(createOSymbol());
            cell.classList.add('disabled');
        } else {
            cell.classList.remove('disabled');
        }
    });
}

function renderResultBoard() {
    const resultCells = document.querySelectorAll('.result-cell');
    resultCells.forEach((cell, index) => {
        cell.innerHTML = '';
        if (GameState.board[index] === 'X') {
            cell.appendChild(createXSymbol());
        } else if (GameState.board[index] === 'O') {
            cell.appendChild(createOSymbol());
        }
    });
}

function updateCurrentPlayerDisplay() {
    const playerName = GameState.currentPlayer === 'X'
        ? GameState.player1Name
        : GameState.player2Name;
    document.getElementById('currentPlayer').textContent = `${playerName}'s Turn`;
}

function highlightWinningCells(winningCells) {
    winningCells.forEach(index => {
        document.querySelector(`.cell[data-index="${index}"]`).classList.add('winning-cell');
    });
}

function shakeBoard() {
    const board = document.getElementById('board');
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            board.style.transform = `translateX(${i % 2 === 0 ? -10 : 10}px)`;
        }, i * 50);
    }
    setTimeout(() => {
        board.style.transform = 'translateX(0)';
    }, 300);
}

function updateScoreboard() {
    const scoreboardContent = document.getElementById('scoreboardContent');
    scoreboardContent.innerHTML = '';

    const playerNames = Object.keys(GameState.scoreboard).sort();

    if (playerNames.length === 0) {
        scoreboardContent.innerHTML = '<p style="text-align: center; opacity: 0.7;">No games played yet</p>';
        return;
    }

    playerNames.forEach(playerName => {
        const stats = GameState.scoreboard[playerName];
        const entry = document.createElement('div');
        entry.className = 'scoreboard-entry';
        entry.innerHTML = `
            <div class="scoreboard-player">${playerName}</div>
            <div class="scoreboard-stats">
                <div class="stat-item">
                    <div class="stat-label">Wins</div>
                    <div class="stat-value">${stats.wins || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Losses</div>
                    <div class="stat-value">${stats.losses || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Draws</div>
                    <div class="stat-value">${stats.draws || 0}</div>
                </div>
            </div>
        `;
        scoreboardContent.appendChild(entry);
    });

    if (GameState.gameHistory.length > 0) {
        const historySection = document.createElement('div');
        historySection.className = 'history-section';
        historySection.innerHTML = '<div class="history-title">Recent Matches</div>';

        GameState.gameHistory.slice(-5).reverse().forEach(match => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.textContent = `${match.date} - ${match.result}`;
            historySection.appendChild(entry);
        });

        scoreboardContent.appendChild(historySection);
    }
}

function initializeGame() {
    GameState.board = ['', '', '', '', '', '', '', '', ''];
    GameState.currentPlayer = 'X';
    GameState.gameActive = true;
    GameState.gameEnded = false;
    renderBoard();
    updateCurrentPlayerDisplay();
    showScreen('gameScreen');
    SoundEngine.playWhoosh();

    if (GameState.gameMode === 'pvc' && GameState.currentPlayer === 'O') {
        setTimeout(makeComputerMove, 500);
    }

    if (GameState.gameMode === 'online') {
        updateOnlineUI();
        document.getElementById('chatPanel').classList.add('active');
    }
}

function handleCellClick(index) {
    if (!GameState.gameActive || GameState.gameEnded || GameState.board[index] !== '') return;

    if (GameState.gameMode === 'pvc' && GameState.currentPlayer === 'O') return;

    if (GameState.gameMode === 'online') {
        const isHost = GameState.isOnlineHost;
        const playerSymbol = isHost ? 'X' : 'O';
        if (GameState.currentPlayer !== playerSymbol) {
            alert("It's not your turn!");
            return;
        }
    }

    makeMove(index);
}

function makeMove(index) {
    if (!GameState.gameActive || GameState.gameEnded || GameState.board[index] !== '') return;

    GameState.board[index] = GameState.currentPlayer;
    SoundEngine.playClick();
    renderBoard();

    if (GameState.gameMode === 'online') {
        broadcastGameState();
    }

    const result = checkWinner(GameState.board);
    if (result) {
        endGame(result.winner, result.winningCells);
        return;
    }

    if (checkDraw(GameState.board)) {
        endGame('draw');
        return;
    }

    GameState.currentPlayer = GameState.currentPlayer === 'X' ? 'O' : 'X';
    updateCurrentPlayerDisplay();

    if (GameState.gameMode === 'online') {
        broadcastGameState();
    }

    if (GameState.gameMode === 'pvc' && GameState.currentPlayer === 'O') {
        setTimeout(makeComputerMove, 400 + Math.random() * 200);
    }
}

function makeComputerMove() {
    const move = getComputerMove(GameState.board, GameState.computerDifficulty);
    makeMove(move);
}

function endGame(result, winningCells = null) {
    if (GameState.gameEnded) return;
    GameState.gameEnded = true;
    GameState.gameActive = false;

    renderBoard();
    if (winningCells) {
        highlightWinningCells(winningCells);
    }

    if (GameState.gameMode === 'online') {
        broadcastGameState();
    }

    if (result === 'draw') {
        SoundEngine.playDraw();
        shakeBoard();
        document.getElementById('resultTitle').textContent = "It's a Draw!";
        document.getElementById('resultMessage').textContent = 'Both players played perfectly!';
        updateScoreboardOnGameEnd('draw');
    } else {
        SoundEngine.playWin();
        const winnerName = result === 'X' ? GameState.player1Name : GameState.player2Name;

        let titleText = `${winnerName} Wins!`;
        if (GameState.gameMode === 'pvc') {
            if (winnerName === 'Computer' || (result === 'O' && GameState.player2Name === 'Computer')) {
                titleText = 'Computer Wins!';
            } else {
                titleText = 'You Win!';
            }
        } else if (GameState.gameMode === 'online') {
            const localSymbol = GameState.isOnlineHost ? 'X' : 'O';
            titleText = (result === localSymbol) ? 'You Win!' : `${winnerName} Wins!`;
        } else {
            titleText = `${winnerName} Wins!`;
        }

        document.getElementById('resultTitle').textContent = titleText;
        document.getElementById('resultMessage').textContent = `${winnerName} wins!`;
        updateScoreboardOnGameEnd(result === 'X' ? 'player1' : 'player2');
    }

    const timestamp = new Date().toISOString();
    const gameRecord = {
        date: timestamp,
        mode: GameState.gameMode === 'pvp' ? 'Local' : GameState.gameMode === 'pvc' ? `Computer (${GameState.computerDifficulty})` : 'Online',
        player1: GameState.player1Name,
        player2: GameState.player2Name,
        result: document.getElementById('resultTitle').textContent,
    };
    GameState.gameHistory.push(gameRecord);
    saveState('tictactoe_history', GameState.gameHistory);

    const winner = result === 'draw' ? 'draw' : (result === 'X' ? 'player1' : 'player2');

    // Prevent duplicate backend submissions in online mode
    if (GameState.gameMode !== 'online' || GameState.isOnlineHost) {
        saveGameResultToBackend(gameRecord, winner);
    }

    renderResultBoard();
    
    // Slight delay before showing result screen so players see the final board state clearly
    setTimeout(() => {
        showScreen('resultScreen');
    }, 600);
}

function updateScoreboardOnGameEnd(result) {
    const p1 = GameState.player1Name;
    const p2 = GameState.player2Name;

    if (!GameState.scoreboard[p1]) {
        GameState.scoreboard[p1] = { wins: 0, losses: 0, draws: 0 };
    }
    if (!GameState.scoreboard[p2]) {
        GameState.scoreboard[p2] = { wins: 0, losses: 0, draws: 0 };
    }

    if (result === 'draw') {
        GameState.scoreboard[p1].draws++;
        GameState.scoreboard[p2].draws++;
    } else if (result === 'player1') {
        GameState.scoreboard[p1].wins++;
        GameState.scoreboard[p2].losses++;
    } else if (result === 'player2') {
        GameState.scoreboard[p2].wins++;
        GameState.scoreboard[p1].losses++;
    }

    saveState('tictactoe_scoreboard', GameState.scoreboard);
    updateScoreboard();
}

function setupPVP() {
    GameState.gameMode = 'pvp';
    GameState.player1Name = 'Player 1';
    GameState.player2Name = 'Player 2';

    const content = document.getElementById('modeSelectContent');
    content.innerHTML = `
        <div class="player-names">
            <div class="input-group">
                <label>Player 1 (X) Name:</label>
                <input type="text" id="player1Input" value="Player 1" placeholder="Enter name...">
            </div>
            <div class="input-group">
                <label>Player 2 (O) Name:</label>
                <input type="text" id="player2Input" value="Player 2" placeholder="Enter name...">
            </div>
        </div>
    `;

    document.getElementById('startGameBtn').onclick = () => {
        GameState.player1Name = document.getElementById('player1Input').value || 'Player 1';
        GameState.player2Name = document.getElementById('player2Input').value || 'Player 2';
        initializeGame();
    };

    showScreen('modeSelectScreen');
}

function setupPVC() {
    GameState.gameMode = 'pvc';
    GameState.player2Name = 'Computer';

    const content = document.getElementById('modeSelectContent');
    content.innerHTML = `
        <div class="player-names">
            <div class="input-group">
                <label>Your Name:</label>
                <input type="text" id="player1Input" value="Player" placeholder="Enter your name...">
            </div>
            <div class="input-group">
                <label>Difficulty Level:</label>
                <div class="difficulty-select">
                    <button class="difficulty-btn active" data-difficulty="easy">Easy</button>
                    <button class="difficulty-btn" data-difficulty="medium">Medium</button>
                    <button class="difficulty-btn" data-difficulty="hard">Hard</button>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            GameState.computerDifficulty = e.target.dataset.difficulty;
        });
    });

    document.getElementById('startGameBtn').onclick = () => {
        GameState.player1Name = document.getElementById('player1Input').value || 'Player';
        initializeGame();
    };

    showScreen('modeSelectScreen');
}

function setupOnline() {
    const content = document.getElementById('modeSelectContent');
    content.innerHTML = `
        <div style="text-align: center; margin: 30px 0;">
            <div style="margin-bottom: 20px; font-size: 1.1em; font-weight: 600;">Start new game or join existing?</div>
            <div style="display: flex; gap: 15px; flex-direction: column;">
                <button class="mode-btn" id="hostBtn" style="margin: 0;">🔓 Host New Game</button>
                <button class="mode-btn" id="joinBtn" style="margin: 0;">🔑 Join Game</button>
            </div>
        </div>
    `;

    document.getElementById('hostBtn').onclick = setupOnlineHost;
    document.getElementById('joinBtn').onclick = setupOnlineJoin;

    showScreen('modeSelectScreen');
}

function setupOnlineHost() {
    GameState.gameMode = 'online';
    GameState.roomCode = generateRoomCode();
    GameState.isOnlineHost = true;

    const content = document.getElementById('modeSelectContent');
    content.innerHTML = `
        <div class="player-names">
            <div class="input-group">
                <label>Your Name:</label>
                <input type="text" id="player1Input" value="Player 1" placeholder="Enter your name...">
            </div>
        </div>
        <div style="text-align: center; padding: 20px; background: var(--cell-bg); border-radius: 10px;">
            <div style="margin-bottom: 10px; font-weight: 600;">Your Room Code:</div>
            <div class="room-code">${GameState.roomCode}</div>
            <button class="copy-btn" id="quickCopyBtn">Copy Room Code</button>
        </div>
    `;

    document.getElementById('quickCopyBtn').onclick = () => {
        navigator.clipboard.writeText(GameState.roomCode);
        alert('Room code copied to clipboard!');
    };

    document.getElementById('startGameBtn').onclick = () => {
        GameState.player1Name = document.getElementById('player1Input').value || 'Player 1';
        GameState.onlineOpponentConnected = false;

        const roomData = {
            player1Name: GameState.player1Name,
            player2Name: null,
            board: GameState.board,
            currentPlayer: 'X',
        };
        saveState(`room_${GameState.roomCode}`, roomData);

        showWaitingScreen();
        listenForOnlineOpponent();
    };

    showScreen('modeSelectScreen');
}

function setupOnlineJoin() {
    GameState.gameMode = 'online';
    GameState.isOnlineHost = false;

    const content = document.getElementById('modeSelectContent');
    content.innerHTML = `
        <div class="player-names">
            <div class="input-group">
                <label>Your Name:</label>
                <input type="text" id="player1Input" value="Player 2" placeholder="Enter your name...">
            </div>
            <div class="input-group">
                <label>Room Code:</label>
                <input type="text" id="roomCodeInput" placeholder="Enter room code..." style="text-transform: uppercase;">
            </div>
        </div>
    `;

    document.getElementById('startGameBtn').onclick = () => {
        const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
        if (!roomCode) {
            alert('Please enter a room code');
            return;
        }

        const roomData = loadState(`room_${roomCode}`);
        if (!roomData) {
            alert('Room not found. Please check the code.');
            return;
        }

        GameState.roomCode = roomCode;
        GameState.player1Name = roomData.player1Name;
        GameState.player2Name = document.getElementById('player1Input').value || 'Player 2';

        roomData.player2Name = GameState.player2Name;
        saveState(`room_${roomCode}`, roomData);

        initializeGame();
    };

    showScreen('modeSelectScreen');
}

function showWaitingScreen() {
    document.getElementById('roomCodeDisplay').textContent = GameState.roomCode;
    document.getElementById('waitingMessage').textContent = 'Share this room code with your opponent (open this link in another tab/window):';

    document.getElementById('cancelWaitBtn').onclick = () => {
        showScreen('homeScreen');
    };

    showScreen('waitingScreen');
}

function listenForOnlineOpponent() {
    const checkInterval = setInterval(() => {
        const roomData = loadState(`room_${GameState.roomCode}`);
        if (roomData && roomData.player2Name && !GameState.onlineOpponentConnected) {
            GameState.onlineOpponentConnected = true;
            GameState.player2Name = roomData.player2Name;
            clearInterval(checkInterval);
            initializeGame();
        }
    }, 500);

    setTimeout(() => clearInterval(checkInterval), 300000);
}

function updateOnlineUI() {
    const roomData = loadState(`room_${GameState.roomCode}`) || {};
    roomData.player1Name = GameState.player1Name;
    roomData.player2Name = GameState.player2Name;
    roomData.board = GameState.board;
    roomData.currentPlayer = GameState.currentPlayer;
    saveState(`room_${GameState.roomCode}`, roomData);
}

function broadcastGameState() {
    const roomData = loadState(`room_${GameState.roomCode}`) || {};
    roomData.board = GameState.board;
    roomData.currentPlayer = GameState.currentPlayer;
    roomData.player1Name = GameState.player1Name;
    roomData.player2Name = GameState.player2Name;
    saveState(`room_${GameState.roomCode}`, roomData);
}

// Synced storage listener for multiplayer
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('room_')) {
        const roomData = JSON.parse(e.newValue);
        if (roomData && roomData.board) {
            GameState.board = roomData.board;
            GameState.currentPlayer = roomData.currentPlayer;
            renderBoard();
            updateCurrentPlayerDisplay();

            const result = checkWinner(GameState.board);
            if (result) {
                endGame(result.winner, result.winningCells);
            } else if (checkDraw(GameState.board)) {
                endGame('draw');
            }
        }
    }
});

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.textContent = `You: ${message}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const messages = loadState(`chat_${GameState.roomCode}`) || [];
    messages.push({ sender: GameState.player1Name, text: message, timestamp: Date.now() });
    saveState(`chat_${GameState.roomCode}`, messages);

    input.value = '';
}

// Check for new chat messages
setInterval(() => {
    if (GameState.gameMode === 'online') {
        const messages = loadState(`chat_${GameState.roomCode}`) || [];
        const chatMessages = document.getElementById('chatMessages');
        if (messages.length > chatMessages.children.length) {
            const newMsg = messages[messages.length - 1];
            if (newMsg.sender !== GameState.player1Name) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'chat-message';
                msgDiv.textContent = `${newMsg.sender}: ${newMsg.text}`;
                chatMessages.appendChild(msgDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }
}, 1000);

// Setup click handlers for buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        if (mode === 'pvp') setupPVP();
        else if (mode === 'pvc') setupPVC();
        else if (mode === 'online') setupOnline();
    });
});

document.querySelectorAll('[data-theme]').forEach(btn => {
    if (btn.classList.contains('theme-btn')) {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyTheme(e.target.dataset.theme);
        });
    }
});

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        handleCellClick(index);
    });
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const index = parseInt(e.currentTarget.dataset.index);
            handleCellClick(index);
        }
    });
    cell.setAttribute('tabindex', '0');
});

document.getElementById('newGameBtn').addEventListener('click', initializeGame);
document.getElementById('menuBtn').addEventListener('click', () => showScreen('homeScreen'));
document.getElementById('backBtn').addEventListener('click', () => showScreen('homeScreen'));

document.getElementById('rematchBtn').addEventListener('click', initializeGame);
document.getElementById('homeBtn').addEventListener('click', () => showScreen('homeScreen'));

document.getElementById('scoreboardToggle').addEventListener('click', () => {
    document.getElementById('scoreboardPanel').classList.toggle('open');
});
document.getElementById('clearScoreboardBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the scoreboard?')) {
        GameState.scoreboard = {};
        saveState('tictactoe_scoreboard', GameState.scoreboard);
        updateScoreboard();
    }
});

document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

window.addEventListener('DOMContentLoaded', () => {
    const savedData = loadAllSavedData();
    GameState.gameHistory = savedData.history;
    GameState.scoreboard = savedData.scoreboard;
    GameState.currentTheme = savedData.theme;

    updateScoreboard();

    const themeBtn = document.querySelector(`[data-theme="${GameState.currentTheme}"]`);
    if (themeBtn) {
        themeBtn.classList.add('active');
    }
});
