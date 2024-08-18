let drivers = [];
let cars = [];
let score = 0;
let currentItem;
let gameMode = 'drivers';
let leaderboard = {drivers: [], cars: []};

const LEADERBOARD_URL = 'https://api.npoint.io/e2ef559b827af9391eab';

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
    await loadLeaderboard();
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

async function saveScore() {
    const username = window.Telegram.WebApp.initDataUnsafe.user.username || 'Anonymous';
    
    // Найдем существующую запись пользователя или добавим новую
    let userIndex = leaderboard[gameMode].findIndex(entry => entry.username === username);
    if (userIndex === -1) {
        leaderboard[gameMode].push({ username, score });
    } else if (leaderboard[gameMode][userIndex].score < score) {
        leaderboard[gameMode][userIndex].score = score;
    } else {
        // Если новый счет не выше предыдущего, выходим из функции
        return;
    }

    // Сортируем и обрезаем до 10 лучших результатов
    leaderboard[gameMode].sort((a, b) => b.score - a.score);
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
        leaderboard = await response.json();
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
            <th colspan="2">Drivers</th>
            <th colspan="2">Cars</th>
        </tr>
        <tr>
            <th>Username</th>
            <th>Score</th>
            <th>Username</th>
            <th>Score</th>
        </tr>
    `;
    
    for (let i = 0; i < 10; i++) {
        const row = table.insertRow();
        const driversEntry = leaderboard.drivers[i] || { username: '', score: '' };
        const carsEntry = leaderboard.cars[i] || { username: '', score: '' };
        
        row.innerHTML = `
            <td>${driversEntry.username}</td>
            <td>${driversEntry.score}</td>
            <td>${carsEntry.username}</td>
            <td>${carsEntry.score}</td>
        `;
    }
    
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