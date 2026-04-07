// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDG_V9d2hd7QxHaAuAVoQ2RsnjB3omB-M",
  authDomain: "bingo-night-c2a1a.firebaseapp.com",
  databaseURL: "https://bingo-night-c2a1a-default-rtdb.firebaseio.com",
  projectId: "bingo-night-c2a1a",
  storageBucket: "bingo-night-c2a1a.firebasestorage.app",
  messagingSenderId: "118563477693",
  appId: "1:118563477693:web:2fe869d3472f20da6a3fd4"
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// Listen for BINGO claims from player cards
onValue(ref(db, 'bingoClaims'), snapshot => {
    const claims = snapshot.val();
    if (!claims) return;
    Object.entries(claims).forEach(([key, claim]) => {
        showBingoClaim(claim.cardNumber, claim.timestamp);
    });
});

function showBingoClaim(cardNumber, timestamp) {
    // Remove any existing banner for same card
    const existing = document.getElementById(`bingo-claim-${cardNumber}`);
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = `bingo-claim-${cardNumber}`;
    banner.style.cssText = `
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #e94560;
        color: white;
        font-size: clamp(14px, 2vw, 22px);
        font-weight: bold;
        padding: 14px 28px;
        border-radius: 12px;
        z-index: 9999;
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 16px;
        animation: slideDown 0.3s ease;
        font-family: Arial, sans-serif;
        letter-spacing: 1px;
    `;
    banner.innerHTML = `
        🎉 BINGO! Card #${cardNumber}
        <button onclick="dismissClaim('${cardNumber}')" style="background:rgba(0,0,0,0.25);border:none;color:white;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:14px;font-weight:bold;">Dismiss</button>
    `;

    if (!document.getElementById('bingo-claim-style')) {
        const style = document.createElement('style');
        style.id = 'bingo-claim-style';
        style.textContent = `@keyframes slideDown { from { top:-60px; opacity:0; } to { top:16px; opacity:1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(banner);
}

window.dismissClaim = function(cardNumber) {
    const banner = document.getElementById(`bingo-claim-${cardNumber}`);
    if (banner) banner.remove();
    remove(ref(db, `bingoClaims/card_${cardNumber}`));
};

let calledNumbers = [];
let lastClickedButton = null;

function createBingoBoard() {
    const columns = ['B', 'I', 'N', 'G', 'O'];

    columns.forEach((col, index) => {
        const columnDiv1 = document.getElementById(col + '1');
        const columnDiv2 = document.getElementById(col + '2');

        for (let i = 1; i <= 15; i++) {
            const number = index * 15 + i;
            const numberButton = document.createElement('button');
            numberButton.textContent = number;
            numberButton.onclick = () => callNumber(col, number);
            numberButton.setAttribute('data-column', col);
            numberButton.setAttribute('data-number', number);

            if (i <= 8) {
                columnDiv1.appendChild(numberButton);
            } else {
                columnDiv2.appendChild(numberButton);
            }
        }
    });
}

function displayPattern() {
    const patternSelect = document.getElementById("patterns");
    const patternImage = document.getElementById("pattern-image");
    const selectedPattern = patternSelect.value;

    const imagePath = `images/${selectedPattern}.gif`;

    patternImage.onerror = () => {
        patternImage.style.display = "none";
    };
    patternImage.onload = () => {
        patternImage.style.display = "block";
    };

    patternImage.src = imagePath;
}

function callNumber(column, number) {
    const button = document.querySelector(`button[data-column="${column}"][data-number="${number}"]`);
    if (!button) return;

    const calledNumber = column + number;

    // Stop all flashing effects
    document.querySelectorAll('.flashing').forEach(btn => {
        btn.classList.remove('flashing');
        btn.style.backgroundColor = 'red';
        btn.style.color = 'white';
    });

    // Toggle called state
    button.classList.toggle('called');

    // Reset previous lastClickedButton
    if (lastClickedButton && lastClickedButton !== button) {
        lastClickedButton.classList.remove('flashing');
        lastClickedButton.style.backgroundColor = 'red';
        lastClickedButton.style.color = 'white';
    }

    // Handle current button
    if (button.classList.contains('called')) {
        button.classList.add('flashing');
        flashEffect(button);
        calledNumbers.push({ column, number, button });
        lastClickedButton = button;

        // Wildcard check
        if (calledNumbers.length >= 3) {
            const wildcardEnabled = document.getElementById('enableWildcard').checked;
            if (wildcardEnabled) {
                const lastThree = calledNumbers.slice(-3);
                const lastDigits = lastThree.map(n => n.number % 10);
                const allSame = lastDigits.every(d => d === lastDigits[0]);
                if (allSame) {
                    triggerWildcard(lastDigits[0]);
                }
            }
        }
    } else {
        button.classList.remove('flashing');
        button.style.backgroundColor = '';
        button.style.color = '';
        calledNumbers = calledNumbers.filter(obj => obj.number !== number || obj.column !== column);

        const last = calledNumbers[calledNumbers.length - 1];
        lastClickedButton = last
            ? document.querySelector(`button[data-column="${last.column}"][data-number="${last.number}"]`)
            : null;

        if (lastClickedButton) {
            lastClickedButton.classList.add('flashing');
            flashEffect(lastClickedButton);
        }
    }

    updateLastNumber();
    updateBallCounter();
}

function triggerWildcard(digit) {
    const banner = document.createElement('div');
    banner.textContent = `Wildcard Activated: 3 ${digit}'s in a row. mark off all remaining ${digit}'s!`;
    banner.className = 'wildcard-banner';
    document.body.appendChild(banner);

    setTimeout(() => banner.remove(), 15000);

    const spray = document.createElement('div');
    spray.className = 'graffiti-spray';
    document.body.appendChild(spray);

    anime({
        targets: spray,
        scale: [0, 1.5],
        opacity: [1, 0],
        duration: 1000,
        easing: 'easeOutExpo',
        complete: () => spray.remove()
    });

    document.querySelectorAll('.bingo-column button').forEach(button => {
        const numStr = button.getAttribute('data-number');
        if (!numStr) return;
        const num = parseInt(numStr);
        if (!isNaN(num) && num % 10 === digit && !button.classList.contains('called')) {
            button.classList.add('called', 'flashing');
            flashEffect(button);
            calledNumbers.push({
                column: button.getAttribute('data-column'),
                number: num,
                button: button
            });
        }
    });

    updateLastNumber();
    updateBallCounter();
}

function flashEffect(button) {
    let flashing = true;
    const interval = setInterval(() => {
        if (!button.classList.contains('flashing')) {
            clearInterval(interval);
            return;
        }
        button.style.backgroundColor = flashing ? 'yellow' : 'red';
        button.style.color = flashing ? 'black' : 'white';
        flashing = !flashing;
    }, 500);
}

function resetBoard() {
    const confirmReset = confirm("Are you sure you want to reset the board?");
    if (!confirmReset) return;

    calledNumbers = [];

    document.querySelectorAll('.bingo-column button').forEach(button => {
        button.classList.remove('called', 'flashing');
        button.style.backgroundColor = '';
        button.style.color = '';
    });

    lastClickedButton = null;
    updateLastNumber();

    // Clear both localStorage and Firebase
    const emptyState = {
        calledNumbers: [],
        lastCalled: null,
        pattern: document.getElementById('patterns')
            ? document.getElementById('patterns').value
            : '',
        timestamp: Date.now()
    };

    try { localStorage.setItem('bingoState', JSON.stringify(emptyState)); } catch(e) {}
    try { set(ref(db, 'bingoState'), emptyState); } catch(e) { console.error('Firebase reset failed:', e); }
    try { set(ref(db, 'bingoClaims'), null); } catch(e) {}

    updateBallCounter();
}

function updateLastNumber() {
    const ballImage    = document.getElementById('lastBallImage');
    const ballFallback = document.getElementById('lastBallFallback');
    const last = calledNumbers[calledNumbers.length - 1];
    if (last) {
        const name = last.column + last.number;
        ballImage.src = `images/balls/${name}.png`;
        ballImage.alt = name;
        ballImage.style.display = 'block';
        ballFallback.style.display = 'none';
        ballImage.onerror = () => {
            ballImage.style.display = 'none';
            ballFallback.textContent = name;
            ballFallback.style.display = 'block';
        };
        ballImage.onload = () => {
            ballImage.style.display = 'block';
            ballFallback.style.display = 'none';
        };
    } else {
        ballImage.src = '';
        ballImage.style.display = 'none';
        ballFallback.textContent = '';
        ballFallback.style.display = 'none';
    }
    updateBallHistory();
}

function updateBallHistory() {
    const container = document.getElementById('ballHistory');
    if (!container) return;
    container.innerHTML = '';
    // Show in reverse order — most recent first
    [...calledNumbers].reverse().forEach(({ column, number }) => {
        const span = document.createElement('span');
        span.className = `history-ball col-${column}`;
        span.textContent = column + number;
        container.appendChild(span);
    });
}

function updateBallCounter() {
    try {
        const counterDiv = document.getElementById('ballCounter');
        const count = calledNumbers.length;
        if (counterDiv) counterDiv.textContent = `Balls Called: ${count}`;
    } catch(e) {}

    const state = {
        calledNumbers: calledNumbers.map(n => ({ column: n.column, number: n.number })),
        lastCalled: calledNumbers.length > 0
            ? { column: calledNumbers[calledNumbers.length - 1].column, number: calledNumbers[calledNumbers.length - 1].number }
            : null,
        pattern: document.getElementById('patterns')
            ? document.getElementById('patterns').value
            : '',
        timestamp: Date.now()
    };

    // Sync to localStorage for display screen
    try {
        localStorage.setItem('bingoState', JSON.stringify(state));
    } catch(e) {
        console.error('localStorage sync failed:', e);
    }

    // Sync to Firebase for player cards
    try {
        set(ref(db, 'bingoState'), state);
    } catch(e) {
        console.error('Firebase sync failed:', e);
    }
}

// Initialize the board
createBingoBoard();

