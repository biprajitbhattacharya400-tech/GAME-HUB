// --- script.js : Global Core App Logic ---

const _AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
const memeAudio = document.getElementById('meme-sound');
const cursorGlow = document.getElementById('cursor-glow');

const windowUtils = {};

windowUtils.initAudio = function() {
    if (!audioCtx) audioCtx = new _AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

windowUtils.playSound = function(type) {
    if (type === 'lose' && memeAudio) {
        memeAudio.volume = 0.8; memeAudio.currentTime = 0;
        memeAudio.play().catch(e => {});
        return;
    }
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'pop') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'win') {
        osc.type = 'square'; osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(1200, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'draw') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(350, now);
        gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
}

windowUtils.fireConfetti = function() {
    const container = document.getElementById('confetti-container');
    if(!container) return;
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

// Ensure API URL handles Render deployment seamlessly
windowUtils.fetchAPI = async function(route, opts = {}) {
    const urls = [
        `https://game-hub-backend-znni.onrender.com${route}`,
        `http://127.0.0.1:8000${route}`,
        `http://localhost:8000${route}`
    ];
    
    for (let url of urls) {
        try {
            let res = await fetch(url, opts);
            if(res.ok) return await res.json();
        } catch(e) {}
    }

    throw new Error("API Failure - Ensure your backend is running or deployment complete.");
}

window.GameHub = windowUtils;

// Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('dashboard');
    const sections = {
        'rps': document.getElementById('rps-game'),
        'tictactoe': document.getElementById('tictactoe-game'),
        'snake': document.getElementById('snake-game')
    };

    // Dashboard Hub interactions
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('coming-soon')) return;
            const targetId = card.getAttribute('data-game');
            if (sections[targetId]) {
                window.GameHub.initAudio();
                window.GameHub.playSound('click');
                dashboard.classList.remove('active');
                sections[targetId].classList.add('active');
                
                // Trigger initializer if exists
                if(window.GameHub[targetId + 'Init']) {
                    window.GameHub[targetId + 'Init']();
                }
            }
        });
    });

    // Back to Hub
    const backBtns = document.querySelectorAll('.back-btn-shared');
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.GameHub.playSound('click');
            const targetId = btn.getAttribute('data-target');
            if (sections[targetId]) sections[targetId].classList.remove('active');
            
            // Trigger cleanup if exists
            if(window.GameHub[targetId + 'Cleanup']) {
                window.GameHub[targetId + 'Cleanup']();
            }
            
            dashboard.classList.add('active');
        });
    });

    // Interactive Cursor Setup
    if (cursorGlow) {
        document.addEventListener('mousemove', e => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });
    }

    // Global Hover 3D Tilt Setup
    const tiltBtns = document.querySelectorAll('.tilt-btn');
    tiltBtns.forEach(btn => {
        btn.addEventListener('mousemove', e => {
            if(btn.disabled || btn.classList.contains('coming-soon')) return;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / 20;
            const tiltY = (centerX - x) / 20;
            
            let scale = btn.classList.contains('game-card') ? 1.02 : 1.05;
            btn.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)`;
        });
        
        // Liquid Ripple core
        if(!btn.classList.contains('game-card')) {
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
        }
    });
});
