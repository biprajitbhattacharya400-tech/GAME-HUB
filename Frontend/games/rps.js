// --- games/rps.js : Rock Paper Scissors Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    const loadingEl = document.getElementById('loading');
    const battleAreaEl = document.getElementById('battle-area');
    const resultTextEl = document.getElementById('result-text');
    const playerMoveEl = document.getElementById('player-move');
    const computerMoveEl = document.getElementById('computer-move');
    const buttons = document.querySelectorAll('.rps-btn');
    const historyList = document.getElementById('history-list');
    const resetBtn = document.getElementById('reset-btn');
    const pFill = document.querySelector('.player .progress-fill');
    const cFill = document.querySelector('.computer .progress-fill');

    // State
    const RPS_STATE_KEY = 'gamehub_rps_state';
    let playerScore = 0;
    let computerScore = 0;
    let gameHistory = [];
    const emojis = { rock: '👊', paper: '✋', scissor: '✌', scissors: '✌' };

    // Load from LocalStorage
    function loadState() {
        try {
            const saved = localStorage.getItem(RPS_STATE_KEY);
            if(saved) {
                const state = JSON.parse(saved);
                playerScore = state.playerScore || 0;
                computerScore = state.computerScore || 0;
                gameHistory = state.gameHistory || [];
                
                playerScoreEl.textContent = playerScore;
                computerScoreEl.textContent = computerScore;
                updateBars();
                updateHistoryUI();
            }
        } catch(e) { console.log('Local storage disabled or corrupted'); }
    }

    function saveState() {
        try {
            localStorage.setItem(RPS_STATE_KEY, JSON.stringify({
                playerScore, computerScore, gameHistory
            }));
        } catch(e) {}
    }

    // Initialize
    loadState();

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            window.GameHub.initAudio(); 
            window.GameHub.playSound('click');
            if ('vibrate' in navigator) navigator.vibrate(30);
            playGame(button.getAttribute('data-choice'));
        });
    });

    resetBtn.addEventListener('click', () => {
        window.GameHub.initAudio(); 
        window.GameHub.playSound('click');
        if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]);

        playerScore = 0; computerScore = 0; gameHistory = [];
        playerScoreEl.textContent = '0'; computerScoreEl.textContent = '0';
        updateBars(); updateHistoryUI();
        saveState();
        
        battleAreaEl.classList.add('hidden');
        resultTextEl.classList.add('hidden');
    });

    async function fetchRockPaperScissors(choice) {
        const urls = [
            `https://game-hub-backend-znni.onrender.com/rps/play/${choice}`,
            `https://game-hub-backend-znni.onrender.com/play/${choice}`,
            `http://127.0.0.1:8000/rps/play/${choice}`,
            `http://localhost:8000/rps/play/${choice}`
        ];
        
        for (let url of urls) {
            try {
                let res = await fetch(url);
                if(res.ok) return await res.json();
            } catch(e) {}
        }
        
        throw new Error("API Failure");
    }

    async function playGame(choice) {
        buttons.forEach(btn => btn.disabled = true);
        
        battleAreaEl.classList.add('hidden');
        resultTextEl.classList.add('hidden');
        resultTextEl.className = 'hidden'; 
        loadingEl.classList.remove('hidden');
        
        try {
            const data = await fetchRockPaperScissors(choice);
            
            const randomWait = Math.floor(Math.random() * 400) + 700; // Suspense
            await new Promise(resolve => setTimeout(resolve, randomWait));
            displayResult(data);
        } catch (error) {
            loadingEl.classList.add('hidden');
            resultTextEl.innerHTML = `<span style="font-size:1.5rem">Connection Error 🔌</span><br><span style="font-size: 0.9rem; font-family: 'Poppins', sans-serif; text-transform:none; font-weight: 400; color: #a0aec0; letter-spacing: 0;">Failed reaching Render API. Backend may be isolated or sleeping.</span>`;
            resultTextEl.classList.remove('hidden'); resultTextEl.classList.add('error');
            buttons.forEach(btn => btn.disabled = false);
        }
    }

    function displayResult(data) {
        loadingEl.classList.add('hidden');
        
        const pMove = data.player.toLowerCase();
        const cMove = data.computer.toLowerCase();
        const result = data.result.toLowerCase();
        
        playerMoveEl.textContent = emojis[pMove] || pMove;
        computerMoveEl.textContent = emojis[cMove] || cMove;
        
        battleAreaEl.classList.remove('hidden');
        
        playerMoveEl.style.animation = 'none'; computerMoveEl.style.animation = 'none';
        void playerMoveEl.offsetWidth; 
        
        playerMoveEl.style.animation = 'popInBig 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        computerMoveEl.style.animation = 'popInBig 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s backwards';

        setTimeout(() => {
            resultTextEl.classList.remove('hidden');
            resultTextEl.style.transform = 'scale(0)';
            void resultTextEl.offsetWidth; 
            resultTextEl.style.transform = 'scale(1)'; 
            
            window.GameHub.playSound(result);
            
            if ('vibrate' in navigator) {
                if (result === 'win') navigator.vibrate([100, 50, 100]);
                else if (result === 'lose') navigator.vibrate([200]);
            }
            
            if (result === 'win') {
                resultTextEl.textContent = '🎉 You Win!';
                resultTextEl.classList.add('win');
                window.GameHub.fireConfetti();
                animateScoreUpdate(playerScoreEl, ++playerScore, document.getElementById('card-player'));
            } else if (result === 'lose') {
                resultTextEl.textContent = '💀 You Lose!';
                resultTextEl.classList.add('lose');
                animateScoreUpdate(computerScoreEl, ++computerScore, document.getElementById('card-computer'));
            } else {
                resultTextEl.textContent = '🤝 It\'s a Draw!';
                resultTextEl.classList.add('draw');
            }
            
            updateBars();
            
            gameHistory.unshift({ p: emojis[pMove]||pMove, c: emojis[cMove]||cMove, res: result });
            if(gameHistory.length > 5) gameHistory.pop(); 
            
            updateHistoryUI();
            saveState();

            buttons.forEach(btn => btn.disabled = false);
        }, 800);
    }

    function animateScoreUpdate(el, newScore, cardEl) {
        cardEl.classList.add('flash-score');
        setTimeout(() => cardEl.classList.remove('flash-score'), 600);
        
        el.style.transform = 'scale(1.5)';
        el.style.color = window.getComputedStyle(cardEl, '::before').backgroundColor; 
        
        let current = newScore - 1;
        el.textContent = current;
        setTimeout(() => el.textContent = newScore, 150);
        
        setTimeout(() => {
            el.style.transform = 'scale(1)';
            el.style.color = '#fff';
        }, 400);
    }

    function updateBars() {
        const total = playerScore + computerScore;
        if (total === 0) {
            pFill.style.width = '0%'; cFill.style.width = '0%';
            return;
        }
        pFill.style.width = (playerScore / total * 100) + '%';
        cFill.style.width = (computerScore / total * 100) + '%';
    }

    function updateHistoryUI() {
        if(gameHistory.length === 0) {
            historyList.innerHTML = '<li class="empty-history">Ready to play!</li>';
            return;
        }
        
        historyList.innerHTML = '';
        gameHistory.forEach((game, index) => {
            const li = document.createElement('li');
            li.className = 'history-item hi-' + game.res;
            li.style.animationDelay = (index * 0.1) + 's';
            
            let resCol = '#a0aec0';
            if(game.res === 'win') resCol = 'var(--win-color)';
            if(game.res === 'lose') resCol = 'var(--lose-color)';
            if(game.res === 'draw') resCol = 'var(--draw-color)';
            
            li.innerHTML = `
                <span style="font-size: 1.4rem;">${game.p}</span> 
                <span style="font-size: 0.8rem; color: #475569; margin: 0 10px;">vs</span> 
                <span style="font-size: 1.4rem;">${game.c}</span>
                <span style="color: ${resCol}; font-weight: 800; margin-left: auto; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1.5px;">${game.res}</span>
            `;
            historyList.appendChild(li);
        });
    }
});
