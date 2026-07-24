const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Game logic helper functions for unit testing
function checkWinner(board) {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], winningCells: combo };
        }
    }
    return null;
}

function checkDraw(board) {
    return board.every(cell => cell !== '') && !checkWinner(board);
}

function getWinnerTitle(result, gameMode, winnerName, isOnlineHost = true) {
    if (result === 'draw') {
        return "It's a Draw!";
    }
    if (gameMode === 'pvc') {
        if (winnerName === 'Computer' || result === 'O') {
            return "Computer Wins!";
        }
        return "You Win!";
    }
    if (gameMode === 'online') {
        const localSymbol = isOnlineHost ? 'X' : 'O';
        return result === localSymbol ? "You Win!" : `${winnerName} Wins!`;
    }
    return `${winnerName} Wins!`;
}

function updateScoreboard(scoreboard, p1, p2, result) {
    if (!scoreboard[p1]) scoreboard[p1] = { wins: 0, losses: 0, draws: 0 };
    if (!scoreboard[p2]) scoreboard[p2] = { wins: 0, losses: 0, draws: 0 };

    if (result === 'draw') {
        scoreboard[p1].draws++;
        scoreboard[p2].draws++;
    } else if (result === 'player1') {
        scoreboard[p1].wins++;
        scoreboard[p2].losses++;
    } else if (result === 'player2') {
        scoreboard[p2].wins++;
        scoreboard[p1].losses++;
    }

    return scoreboard;
}

function recordGameWithDeduplication(history, newRecord) {
    const requestTime = new Date(newRecord.date).getTime();
    const isDuplicate = history.some(rec => {
        const recTime = new Date(rec.date).getTime();
        return rec.player1 === newRecord.player1 &&
            rec.player2 === newRecord.player2 &&
            rec.mode === newRecord.mode &&
            Math.abs(requestTime - recTime) < 5000;
    });

    if (!isDuplicate) {
        history.push(newRecord);
        return true;
    }
    return false;
}

// -------------------------------------------------------------
// TEST SUITE
// -------------------------------------------------------------

test('1. Player win - correctly calculates winner and title', () => {
    const board = ['X', 'X', 'X', 'O', 'O', '', '', '', ''];
    const result = checkWinner(board);
    assert.ok(result, 'Should detect winning board');
    assert.equal(result.winner, 'X');

    const title = getWinnerTitle('X', 'pvc', 'Player');
    assert.equal(title, 'You Win!');
});

test('2. Computer win - correctly displays "Computer Wins!"', () => {
    const board = ['X', 'X', '', 'O', 'O', 'O', 'X', '', ''];
    const result = checkWinner(board);
    assert.ok(result, 'Should detect computer victory');
    assert.equal(result.winner, 'O');

    const title = getWinnerTitle('O', 'pvc', 'Computer');
    assert.equal(title, 'Computer Wins!');
});

test('3. Draw - correctly detects draw state and title', () => {
    const board = [
        'X', 'O', 'X',
        'X', 'O', 'O',
        'O', 'X', 'X'
    ];
    assert.equal(checkWinner(board), null);
    assert.equal(checkDraw(board), true);

    const title = getWinnerTitle('draw', 'pvc', 'Computer');
    assert.equal(title, "It's a Draw!");
});

test('4. Statistics update - Total Games equals Wins + Losses + Draws', () => {
    const scoreboard = {};
    updateScoreboard(scoreboard, 'Player', 'Computer', 'player1');
    updateScoreboard(scoreboard, 'Player', 'Computer', 'player2');
    updateScoreboard(scoreboard, 'Player', 'Computer', 'draw');

    const playerStats = scoreboard['Player'];
    const totalPlayerGames = playerStats.wins + playerStats.losses + playerStats.draws;
    assert.equal(playerStats.wins, 1);
    assert.equal(playerStats.losses, 1);
    assert.equal(playerStats.draws, 1);
    assert.equal(totalPlayerGames, 3, 'Wins + Losses + Draws must equal Total Games');
});

test('5. Prevention of duplicate game result updates', () => {
    const history = [];
    const record = {
        date: new Date().toISOString(),
        mode: 'Online',
        player1: 'Alice',
        player2: 'Bob',
        result: 'You Win!'
    };

    const firstAdd = recordGameWithDeduplication(history, record);
    const secondAdd = recordGameWithDeduplication(history, record);

    assert.equal(firstAdd, true, 'First record should be added');
    assert.equal(secondAdd, false, 'Duplicate record within 5 seconds must be rejected');
    assert.equal(history.length, 1, 'History length should remain 1');
});
