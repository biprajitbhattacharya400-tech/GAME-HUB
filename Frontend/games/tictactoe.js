// --- games/tictactoe.js : Tic Tac Toe Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('ttt-board');
    const cells = document.querySelectorAll('.ttt-cell');
    const statusEl = document.getElementById('ttt-status');
    const loadingEl = document.getElementById('ttt-loading');
    const resetBtn = document.getElementById('ttt-reset');
    
    let board = ['', '', '', '', '', '', '', '', ''];
    let isGameOver = false;
    let isPlayerTurn = true;
    
    window.GameHub.tictactoeInit = function() {
        resetBoard();
    }
    
    cells.forEach(c => {
        c.addEventListener('click', () => handleCellClick(c.getAttribute('data-index')));
        c.addEventListener('mouseenter', () => {
            if(!isGameOver && isPlayerTurn && c.textContent === '') {
                c.style.background = 'rgba(255,255,255,0.08)';
            }
        });
        c.addEventListener('mouseleave', () => {
            c.style.background = 'rgba(18, 20, 36, 0.9)';
        });
    });
    
    resetBtn.addEventListener('click', resetBoard);
    
    function resetBoard() {
        board = ['', '', '', '', '', '', '', '', ''];
        isGameOver = false;
        isPlayerTurn = true;
        statusEl.textContent = 'Your turn! (X)';
        statusEl.className = 'game-status-text';
        cells.forEach(c => {
            c.textContent = '';
            c.className = 'ttt-cell empty';
        });
    }
    
    async function handleCellClick(index) {
        if(isGameOver || !isPlayerTurn || board[index] !== '') return;
        
        // Player plays X
        board[index] = 'X';
        updateUI();
        window.GameHub.playSound('pop');
        
        if('vibrate' in navigator) navigator.vibrate(20);
        
        let winnerRes = checkLocalWinner(board);
        if(winnerRes) {
            finishGame(winnerRes.winner, winnerRes.line);
            return;
        }

        // Computer Turn
        isPlayerTurn = false;
        statusEl.textContent = 'AI is calculating...';
        loadingEl.classList.remove('hidden');
        
        try {
            // Note: The python router accepts {"board": [...]} on /move
            const data = await window.GameHub.fetchAPI('/tictactoe/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ board: board })
            });
            
            // Slight delay feeling
            await new Promise(r => setTimeout(r, 600));
            
            board = data.board;
            updateUI();
            
            if(data.winner) {
                finishGame(data.winner, data.line);
            } else {
                isPlayerTurn = true;
                statusEl.textContent = 'Your turn! (X)';
                window.GameHub.playSound('pop');
            }
            
        } catch (error) {
            statusEl.textContent = 'API Connection Error!';
            statusEl.classList.add('error');
            isGameOver = true;
        } finally {
            loadingEl.classList.add('hidden');
        }
    }
    
    function updateUI() {
        cells.forEach((c, i) => {
            c.textContent = board[i];
            if(board[i] === 'X') c.className = 'ttt-cell X';
            if(board[i] === 'O') c.className = 'ttt-cell O';
            if(board[i] === '') c.className = 'ttt-cell empty';
        });
    }
    
    function finishGame(winner, line) {
        isGameOver = true;
        if(winner === 'X') {
            statusEl.textContent = '🎉 You Win!';
            statusEl.classList.add('win');
            window.GameHub.playSound('win');
            window.GameHub.fireConfetti();
        } else if (winner === 'O') {
            statusEl.textContent = '💀 AI Wins!';
            statusEl.classList.add('lose');
            window.GameHub.playSound('lose');
        } else {
            statusEl.textContent = '🤝 Draw!';
            statusEl.classList.add('draw');
            window.GameHub.playSound('draw');
        }
        
        // Highlight win line
        if(line && line.length) {
            line.forEach(i => cells[i].classList.add('win-cell'));
        }
    }
    
    function checkLocalWinner(b) {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for(let l of lines) {
            if(b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) {
                return {winner: b[l[0]], line: l};
            }
        }
        if(!b.includes('')) return {winner: 'Draw', line: []};
        return null;
    }
});
