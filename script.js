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
    updateBallCounter();
}

function updateLastNumber() {
    const ballImage    = document.getElementById('lastBallImage');
    const ballFallback = document.getElementById('lastBallFallback');

    // Always clear handlers and reset both elements first
    ballImage.onload  = null;
    ballImage.onerror = null;
    ballImage.src     = '';
    ballImage.style.display    = 'none';
    ballFallback.textContent   = '';
    ballFallback.style.display = 'none';

    const last = calledNumbers[calledNumbers.length - 1];
    if (last) {
        const name = last.column + last.number;
        ballImage.alt = name;
        ballImage.onload = () => {
            ballImage.style.display = 'block';
            ballFallback.style.display = 'none';
        };
        ballImage.onerror = () => {
            ballImage.style.display = 'none';
            ballFallback.textContent = name;
            ballFallback.style.display = 'block';
        };
        ballImage.src = `images/balls/${name}.png`;
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

    // Always sync state to localStorage for display page
    try {
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
        localStorage.setItem('bingoState', JSON.stringify(state));
    } catch(e) {
        console.error('State sync failed:', e);
    }
}

// Initialize the board
createBingoBoard();

