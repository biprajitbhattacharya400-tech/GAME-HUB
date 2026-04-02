// --- games/snake.js : Core API Async Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('snake-board');
    const scoreEl = document.getElementById('snake-score-val');
    const loadingEl = document.getElementById('snake-loading');
    const overlayEl = document.getElementById('snake-overlay');
    const msgEl = document.getElementById('snake-overlay-msg');
    const resetBtn = document.getElementById('snake-reset');
    
    const GRID_SIZE = 15;
    boardEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 20px)`;
    boardEl.style.gridTemplateRows = `repeat(${GRID_SIZE}, 20px)`;
    
    let snake = [];
    let food = {};
    let direction = 'UP';
    let isGameOver = false;
    let gameLoopTask = null;
    let fetchingTick = false; // Prevent overlapping HTTP calls
    let _score = 0;
    
    window.GameHub.snakeInit = function() {
        // Only init if not already playing
        if (!gameLoopTask && !isGameOver) {
            resetGame();
        }
    }
    
    window.GameHub.snakeCleanup = function() {
        if(gameLoopTask) clearTimeout(gameLoopTask);
        gameLoopTask = null;
    }
    
    document.addEventListener('keydown', e => {
        if(isGameOver) return;
        const keys = {
            'ArrowUp': 'UP', 'w': 'UP',
            'ArrowDown': 'DOWN', 's': 'DOWN',
            'ArrowLeft': 'LEFT', 'a': 'LEFT',
            'ArrowRight': 'RIGHT', 'd': 'RIGHT'
        };
        if(keys[e.key]) {
            // Prevent 180 reversing visually
            const newDir = keys[e.key];
            const badMap = {'UP':'DOWN','DOWN':'UP','LEFT':'RIGHT','RIGHT':'LEFT'};
            if(badMap[direction] !== newDir) {
                direction = newDir;
                e.preventDefault();
            }
        }
    });
    
    // Touch D-PAD
    const binds = {'up':'UP','down':'DOWN','left':'LEFT','right':'RIGHT'};
    for(let k in binds) {
        const btn = document.getElementById('btn-'+k);
        if(btn) btn.addEventListener('click', () => {
            const newDir = binds[k];
            const badMap = {'UP':'DOWN','DOWN':'UP','LEFT':'RIGHT','RIGHT':'LEFT'};
            if(badMap[direction] !== newDir) direction = newDir;
        });
    }

    resetBtn.addEventListener('click', resetGame);
    
    function resetGame() {
        snake = [
            {x: Math.floor(GRID_SIZE/2), y: Math.floor(GRID_SIZE/2)},
            {x: Math.floor(GRID_SIZE/2), y: Math.floor(GRID_SIZE/2) + 1}
        ];
        food = {x: 3, y: 3};
        direction = 'UP';
        isGameOver = false;
        _score = 0;
        scoreEl.textContent = _score;
        fetchingTick = false;
        
        overlayEl.classList.add('hidden');
        
        if(gameLoopTask) clearTimeout(gameLoopTask);
        
        // Zero-lag dynamic loop
        speedInterval = 180; // Medium pace starting speed
        gameLoopTask = setTimeout(gameLoop, speedInterval); 
        renderBoard();
    }
    
    let speedInterval = 180;
    function gameLoop() {
        if(isGameOver) return;
        doLocalTick();
        if(!isGameOver) gameLoopTask = setTimeout(gameLoop, speedInterval);
    }
    
    function doLocalTick() {
        if(isGameOver) return;
        
        let head = snake[0];
        let newHead = {x: head.x, y: head.y};
        
        if(direction === 'UP') newHead.y -= 1;
        else if(direction === 'DOWN') newHead.y += 1;
        else if(direction === 'LEFT') newHead.x -= 1;
        else if(direction === 'RIGHT') newHead.x += 1;
        
        // 1. Wall collision
        if(newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            return endGame("Hit the Wall!");
        }
        
        // 2. Self collision (exclude extreme tail since it moves away)
        for(let i=0; i<snake.length-1; i++) {
            if(newHead.x === snake[i].x && newHead.y === snake[i].y) {
                return endGame("Hit Yourself!");
            }
        }
        
        snake.unshift(newHead);
        
        // 3. Eat food check
        if(newHead.x === food.x && newHead.y === food.y) {
            // Generate new food dynamically
            let isFoodSafe = false;
            while(!isFoodSafe) {
                food.x = Math.floor(Math.random() * GRID_SIZE);
                food.y = Math.floor(Math.random() * GRID_SIZE);
                isFoodSafe = !snake.some(p => p.x === food.x && p.y === food.y);
            }
            
            let nextScore = (snake.length - 2) * 10;
            if(nextScore > _score) {
                _score = nextScore;
                scoreEl.textContent = _score;
                
                // Increase speed dynamically down to a cap of 80ms
                if(speedInterval > 80) speedInterval -= 3;
                
                window.GameHub.playSound('pop');
                scoreEl.style.transform = 'scale(1.5)';
                setTimeout(() => scoreEl.style.transform = 'scale(1)', 200);
            }
        } else {
            snake.pop(); // Not eating -> remove tail end
        }
        
        renderBoard();
    }
    
    function endGame(customMsg) {
        isGameOver = true;
        clearTimeout(gameLoopTask);
        gameLoopTask = null;
        msgEl.textContent = customMsg || "Game Over!";
        overlayEl.classList.remove('hidden');
        window.GameHub.playSound('lose');
        if('vibrate' in navigator) navigator.vibrate(200);
    }
    
    function renderBoard() {
        boardEl.innerHTML = '';
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'snake-cell';
                
                // Check snake
                const isSnake = snake.findIndex(p => p.x === x && p.y === y);
                if(isSnake === 0) cell.classList.add('snake-head');
                else if(isSnake > 0) cell.classList.add('snake-body');
                
                // Check food
                if(food.x === x && food.y === y) cell.classList.add('snake-food');
                
                boardEl.appendChild(cell);
            }
        }
    }
});
