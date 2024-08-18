let drivers = [];
let cars = [];
let score = 0;
let currentItem;
let gameMode = 'drivers';
let leaderboard = {drivers: [], cars: []};

async function loadNames(category) {
    try {
        const response = await fetch(`${category}/names.txt`);
        const text = await response.text();
        return text.split('\n').filter(name => name.trim() !== '');
    } catch (error) {
        console.error(`Error loading ${category} names:`, error);
        return [];
    }
}

async function initializeGame() {
    drivers = await loadNames('drivers');
    cars = await loadNames('cars');
    initApp();
}

function startGame(mode) {
    gameMode = mode;
    score = 0;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    nextQuestion();
}

function nextQuestion() {
    document.getElementById('options').innerHTML = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('next-question').style.display = 'none';

    const items = gameMode === 'drivers' ? drivers : cars;
    currentItem = items[Math.floor(Math.random() * items.length)];
    const options = getRandomOptions(currentItem, items);

    document.getElementById('item-photo').style.backgroundImage = `url('${gameMode}/images/${currentItem}.jpg')`;
    //document.getElementById('item-photo').style.backgroundImage = `url('${gameMode}/images/${encodeURIComponent(currentItem)}.jpg')`;

    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        document.getElementById('options').appendChild(button);
    });
}

function getRandomOptions(correctAnswer, items) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        if (!options.includes(randomItem)) {
            options.push(randomItem);
        }
    }
    return shuffleArray(options);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkAnswer(selectedItem) {
    const resultElement = document.getElementById('result');
    const nextQuestionButton = document.getElementById('next-question');

    if (selectedItem === currentItem) {
        score++;
        resultElement.textContent = `Correct! Your score is ${score}.`;
        resultElement.style.color = 'green';
        nextQuestionButton.style.display = 'inline-block';
    } else {
        resultElement.textContent = `Wrong. The correct answer is ${currentItem}. Your score is ${score}.`;
        resultElement.style.color = 'red';
        endGame();
        return;
    }

    document.querySelectorAll('#options button').forEach(button => {
        button.disabled = true;
    });
}

function endGame() {
    saveScore();
    window.Telegram.WebApp.showAlert(`Game Over! Your final score is ${score}.`);
    backToMenu();
}

function saveScore() {
    const username = window.Telegram.WebApp.initDataUnsafe.user.username || 'Anonymous';
    leaderboard[gameMode].push({ username, score });
    leaderboard[gameMode].sort((a, b) => b.score - a.score);
    leaderboard[gameMode] = leaderboard[gameMode].slice(0, 10); // Keep only top 10
    localStorage.setItem('f1QuizLeaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    const storedLeaderboard = localStorage.getItem('f1QuizLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
    }
    showLeaderboard();
}

function showLeaderboard() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'block';
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Drivers Score</th>
            <th>Cars Score</th>
        </tr>
    `;
    
    const combinedLeaderboard = {};
    
    ['drivers', 'cars'].forEach(mode => {
        leaderboard[mode].forEach(entry => {
            if (!combinedLeaderboard[entry.username]) {
                combinedLeaderboard[entry.username] = { username: entry.username, drivers: 0, cars: 0 };
            }
            combinedLeaderboard[entry.username][mode] = entry.score;
        });
    });
    
    Object.values(combinedLeaderboard)
        .sort((a, b) => (b.drivers + b.cars) - (a.drivers + a.cars))
        .slice(0, 10)
        .forEach((entry, index) => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.drivers}</td>
                <td>${entry.cars}</td>
            `;
        });
    
    leaderboardList.appendChild(table);
}

function backToMenu() {
    document.getElementById('leaderboard-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
}

document.getElementById('next-question').addEventListener('click', nextQuestion);
document.getElementById('play-drivers').addEventListener('click', () => startGame('drivers'));
document.getElementById('play-cars').addEventListener('click', () => startGame('cars'));
document.getElementById('leaderboard-button').addEventListener('click', loadLeaderboard);
document.getElementById('back-to-menu').addEventListener('click', backToMenu);

window.Telegram.WebApp.ready();

const isDarkMode = window.Telegram.WebApp.colorScheme === 'dark';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

function initApp() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'none';
    loadLeaderboard();
}

// Запуск приложения
initializeGame();
