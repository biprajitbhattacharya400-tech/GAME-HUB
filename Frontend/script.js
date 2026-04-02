const playerScoreEl = document.getElementById('player-score');
const computerScoreEl = document.getElementById('computer-score');
const loadingEl = document.getElementById('loading');
const battleAreaEl = document.getElementById('battle-area');
const resultTextEl = document.getElementById('result-text');
const playerMoveEl = document.getElementById('player-move');
const computerMoveEl = document.getElementById('computer-move');
const buttons = document.querySelectorAll('.choice-btn');
const historyList = document.getElementById('history-list');
const resetBtn = document.getElementById('reset-btn');
const pFill = document.querySelector('.player .progress-fill');
const cFill = document.querySelector('.computer .progress-fill');

// Meme Audio element reference
const memeAudio = document.getElementById('meme-sound');

// Interactive Cursor Tracker
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
    // We strictly use translate3d or modifying left/top 
    // It's smooth enough when transitioned in CSS with a tiny lag
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

let playerScore = 0;
let computerScore = 0;
let gameHistory = [];
const emojis = { rock: '👊', paper: '✋', scissor: '✌', scissors: '✌' };

// 3D Tilt + Ripple Effects via JS
const tiltBtns = document.querySelectorAll('.tilt-btn');
tiltBtns.forEach(btn => {
    btn.addEventListener('mousemove', e => {
        if(btn.disabled) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = (y - centerY) / 8;
        const tiltY = (centerX - x) / 8;
        btn.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.05)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = `perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
    
    // Liquid Ripple effect
    btn.addEventListener('click', function(e) {
        if(btn.disabled) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Sound System Setup
const _AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new _AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Function to handle game SFX
function playSound(type) {
    if (type === 'lose') {
        // Explictly play the MP3 meme sound over synth audio
        memeAudio.volume = 0.8;
        memeAudio.currentTime = 0;
        memeAudio.play().catch(e => console.log('Audio playback prevented by browser policies. Interaction needed.'));
        return; // Early return to avoid synth lose play
    }

    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(1200, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'draw') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
}

function fireConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = ''; 
    const colors = ['#00ff88', '#00f0ff', '#9d00ff', '#ffcc00', '#ffffff'];
    for(let i=0; i<60; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = (Math.random() * 100) + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = (Math.random() * 0.4) + 's';
        conf.style.animationDuration = (Math.random() * 1.5 + 1.2) + 's';
        container.appendChild(conf);
        setTimeout(() => conf.remove(), 3000);
    }
}

// Event Listeners
buttons.forEach(button => {
    button.addEventListener('click', () => {
        initAudio(); playSound('click');
        if ('vibrate' in navigator) navigator.vibrate(30);
        playGame(button.getAttribute('data-choice'));
    });
});

resetBtn.addEventListener('click', () => {
    initAudio(); playSound('click');
    if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]);

    playerScore = 0; computerScore = 0; gameHistory = [];
    playerScoreEl.textContent = '0'; computerScoreEl.textContent = '0';
    updateBars(); updateHistoryUI();
    
    battleAreaEl.classList.add('hidden');
    resultTextEl.classList.add('hidden');
});

async function playGame(choice) {
    buttons.forEach(btn => btn.disabled = true);
    
    battleAreaEl.classList.add('hidden');
    resultTextEl.classList.add('hidden');
    resultTextEl.className = 'hidden'; 
    loadingEl.classList.remove('hidden');
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/rps/play/${choice}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        // Suspense timing logic
        const randomWait = Math.floor(Math.random() * 400) + 700; // 700-1100ms
        await new Promise(resolve => setTimeout(resolve, randomWait));
        displayResult(data);
    } catch (error) {
        loadingEl.classList.add('hidden');
        resultTextEl.innerHTML = `<span style="font-size:1.5rem">Connection Error 🔌</span><br><span style="font-size: 0.9rem; font-family: 'Poppins', sans-serif; text-transform:none; font-weight: 400;">Is the FastAPI backend running?</span>`;
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
    
    // Animate moves gracefully
    playerMoveEl.style.animation = 'none'; computerMoveEl.style.animation = 'none';
    void playerMoveEl.offsetWidth; 
    
    playerMoveEl.style.animation = 'popInBig 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    computerMoveEl.style.animation = 'popInBig 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s backwards';

    setTimeout(() => {
        resultTextEl.classList.remove('hidden');
        resultTextEl.style.transform = 'scale(0)';
        void resultTextEl.offsetWidth; // Reflow
        resultTextEl.style.transform = 'scale(1)'; // CSS transition
        
        // Play final sounds (synthesized or mp3 file for lose)
        playSound(result);
        
        if ('vibrate' in navigator) {
            if (result === 'win') navigator.vibrate([100, 50, 100]);
            else if (result === 'lose') navigator.vibrate([200]);
        }
        
        if (result === 'win') {
            resultTextEl.textContent = '🎉 You Win!';
            resultTextEl.classList.add('win');
            fireConfetti();
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
        
        // Add to history
        gameHistory.unshift({ p: emojis[pMove]||pMove, c: emojis[cMove]||cMove, res: result });
        if(gameHistory.length > 5) gameHistory.pop(); // Keep only last 5 matches
        
        updateHistoryUI();
        buttons.forEach(btn => btn.disabled = false);
    }, 800);
}

function animateScoreUpdate(el, newScore, cardEl) {
    cardEl.classList.add('flash-score');
    setTimeout(() => cardEl.classList.remove('flash-score'), 600);
    
    el.style.transform = 'scale(1.5)';
    el.style.color = window.getComputedStyle(cardEl, '::before').backgroundColor; // gets accent color approx
    
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
