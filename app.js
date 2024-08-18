let drivers = {easy: [], medium: [], hard: []};
let cars = {easy: [], medium: [], hard: []};
let score = 0;
let currentItem;
let gameMode = '';
let difficulty = '';
let leaderboard = {drivers: [], cars: []};

const LEADERBOARD_URL = 'https://api.npoint.io/e2ef559b827af9391eab';

async function loadNames(category, difficulty) {
    try {
        const response = await fetch(`${category}/${difficulty}/names.txt`);
        const text = await response.text();
        return text.split('\n').filter(name => name.trim() !== '');
    } catch (error) {
        console.error(`Error loading ${category} ${difficulty} names:`, error);
        return [];
    }
}

async function initializeGame() {
    for (const diff of ['easy', 'medium', 'hard']) {
        drivers[diff] = await loadNames('drivers', diff);
        cars[diff] = await loadNames('cars', diff);
    }
    await loadLeaderboard();
    initApp();
}

function showDifficultyMenu(mode) {
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'block';
}

function startGame(diff) {
    difficulty = diff;
    score = 0;
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    nextQuestion();
}

function nextQuestion() {
    document.getElementById('options').innerHTML = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('next-question').style.display = 'none';

    const items = gameMode === 'drivers' ? drivers[difficulty] : cars[difficulty];
    currentItem = items[Math.floor(Math.random() * items.length)];
    const options = getRandomOptions(currentItem, items);

    document.getElementById('item-photo').style.backgroundImage = `url('${gameMode}/${difficulty}/images/${currentItem}.jpg')`;

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
    saveScore().then(() => {
        loadLeaderboard();  // Загружаем обновленный лидерборд
        window.Telegram.WebApp.showAlert(`Game Over! Your final score is ${score}.`);
        backToMenu();
    });
}

async function saveScore() {
    const username = window.Telegram.WebApp.initDataUnsafe.user.username || 'Anonymous';
    
    // Проверяем, существует ли уже запись для этого пользователя
    const existingEntryIndex = leaderboard[gameMode].findIndex(
        entry => entry.username === username && entry.difficulty === difficulty
    );

    if (existingEntryIndex !== -1) {
        // Если запись существует, обновляем ее только если новый счет выше
        if (score > leaderboard[gameMode][existingEntryIndex].score) {
            leaderboard[gameMode][existingEntryIndex].score = score;
        }
    } else {
        // Если записи нет, добавляем новую
        leaderboard[gameMode].push({ username, score, difficulty });
    }

    // Сортируем лидерборд
    leaderboard[gameMode].sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
            const difficultyOrder = {hard: 2, medium: 1, easy: 0};
            return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        }
        return b.score - a.score;
    });

    // Оставляем только топ-10 результатов
    leaderboard[gameMode] = leaderboard[gameMode].slice(0, 10);

    try {
        const response = await fetch(LEADERBOARD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leaderboard),
        });
        if (!response.ok) {
            throw new Error('Failed to save leaderboard');
        }
        console.log('Leaderboard saved successfully');
    } catch (error) {
        console.error('Error saving leaderboard:', error);
        window.Telegram.WebApp.showAlert('Failed to save your score. Please try again later.');
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(LEADERBOARD_URL);
        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }
        const data = await response.json();
        console.log('Loaded leaderboard data:', data);
        
        if (data && typeof data === 'object' && 'drivers' in data && 'cars' in data) {
            leaderboard = data;
        } else {
            console.error('Invalid leaderboard data structure');
            leaderboard = { drivers: [], cars: [] };
        }
        
        showLeaderboard();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        window.Telegram.WebApp.showAlert('Failed to load leaderboard. Please try again later.');
    }
}

function showLeaderboard() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'block';
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th colspan="3">Drivers</th>
            <th colspan="3">Cars</th>
        </tr>
        <tr>
            <th>Name</th>
            <th>S</th>
            <th>lvl</th>
            <th>Name</th>
            <th>S</th>
            <th>lvl</th>
        </tr>
    `;
    
    const maxEntries = Math.max(leaderboard.drivers.length, leaderboard.cars.length, 10);
    
    for (let i = 0; i < maxEntries; i++) {
        const row = table.insertRow();
        const driversEntry = leaderboard.drivers[i] || { username: '', score: '', difficulty: '' };
        const carsEntry = leaderboard.cars[i] || { username: '', score: '', difficulty: '' };
        
        row.innerHTML = `
            <td title="${driversEntry.username}">${truncateUsername(driversEntry.username)}</td>
            <td>${driversEntry.score}</td>
            <td>${getDifficultyShorthand(driversEntry.difficulty)}</td>
            <td title="${carsEntry.username}">${truncateUsername(carsEntry.username)}</td>
            <td>${carsEntry.score}</td>
            <td>${getDifficultyShorthand(carsEntry.difficulty)}</td>
        `;
    }
    
    leaderboardList.appendChild(table);
}

function truncateUsername(username) {
    return username.length > 8 ? username.substring(0, 7) + '…' : username;
}

function getDifficultyShorthand(difficulty) {
    switch(difficulty) {
        case 'easy': return 'E';
        case 'medium': return 'M';
        case 'hard': return 'H';
        default: return '';
    }
}

function backToMenu() {
    document.getElementById('leaderboard-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
}

document.getElementById('play-drivers').addEventListener('click', () => showDifficultyMenu('drivers'));
document.getElementById('play-cars').addEventListener('click', () => showDifficultyMenu('cars'));
document.getElementById('easy').addEventListener('click', () => startGame('easy'));
document.getElementById('medium').addEventListener('click', () => startGame('medium'));
document.getElementById('hard').addEventListener('click', () => startGame('hard'));
document.getElementById('leaderboard-button').addEventListener('click', showLeaderboard);
document.getElementById('back-to-menu').addEventListener('click', backToMenu);
document.getElementById('back-to-main').addEventListener('click', backToMenu);
document.getElementById('next-question').addEventListener('click', nextQuestion);
document.getElementById('end-game').addEventListener('click', endGame);

window.Telegram.WebApp.ready();

const isDarkMode = window.Telegram.WebApp.colorScheme === 'dark';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

function initApp() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
}

// Запуск приложения
initializeGame();