// Helper logic for winning checks, available moves, minimax AI, and symbols

function checkWinner(board) {
    const winConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return { winner: board[a], winningCells: condition };
        }
    }
    return null;
}

function checkDraw(board) {
    return board.every(cell => cell !== '');
}

function getAvailableMoves(board) {
    return board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
}

// minimax algorithm for the unbeatable Hard AI
function minimax(board, depth = 0, isMaximizing = true) {
    const result = checkWinner(board);
    if (result) {
        return result.winner === 'O' ? 10 - depth : -10 + depth;
    }
    if (checkDraw(board)) {
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// computes the next move for the AI opponent based on difficulty level
function getComputerMove(board, difficulty) {
    const availableMoves = getAvailableMoves(board);

    if (difficulty === 'easy') {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (difficulty === 'medium') {
        // 1. Try to win if possible
        for (let move of availableMoves) {
            const testBoard = [...board];
            testBoard[move] = 'O';
            if (checkWinner(testBoard)?.winner === 'O') {
                return move;
            }
        }

        // 2. Block the opponent's winning move
        for (let move of availableMoves) {
            const testBoard = [...board];
            testBoard[move] = 'X';
            if (checkWinner(testBoard)?.winner === 'X') {
                return move;
            }
        }

        // Otherwise random
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (difficulty === 'hard') {
        let bestScore = -Infinity;
        let bestMove = availableMoves[0];

        for (let move of availableMoves) {
            const testBoard = [...board];
            testBoard[move] = 'O';
            const score = minimax(testBoard, 0, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }
}

// DOM SVG creation helpers
function createXSymbol() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.innerHTML = `
        <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
        <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `;
    return svg;
}

function createOSymbol() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.innerHTML = `
        <circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>
    `;
    return svg;
}
