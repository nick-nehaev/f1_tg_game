const drivers = [
    "Lewis Hamilton", "George Russell", "Max Verstappen", "Sergio Perez",
    "Charles Leclerc", "Carlos Sainz", "Lando Norris", "Oscar Piastri",
    "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Pierre Gasly",
    "Yuki Tsunoda", "Daniel Ricciardo", "Valtteri Bottas", "Zhou Guanyu",
    "Kevin Magnussen", "Nico Hulkenberg", "Alexander Albon", "Logan Sargeant"
];

let score = 0;
let currentDriver;
let leaderboard = [];

function startGame() {
    score = 0;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    nextQuestion();
}

function nextQuestion() {
    document.getElementById('options').innerHTML = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('next-question').style.display = 'none';

    currentDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const options = getRandomOptions(currentDriver);

    // Здесь нужно добавить путь к фотографии пилота
    //document.getElementById('driver-photo').style.backgroundImage = `url('images/${currentDriver.replace(' ', '_').toLowerCase()}.jpg')`;
    document.getElementById('driver-photo').style.backgroundImage = `url('images/${currentDriver}.jpg')`;


    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        document.getElementById('options').appendChild(button);
    });
}

function getRandomOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        if (!options.includes(randomDriver)) {
            options.push(randomDriver);
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

function checkAnswer(selectedDriver) {
    const resultElement = document.getElementById('result');
    const nextQuestionButton = document.getElementById('next-question');

    if (selectedDriver === currentDriver) {
        score++;
        resultElement.textContent = `Correct! Your score is ${score}.`;
        resultElement.style.color = 'green';
    } else {
        resultElement.textContent = `Wrong. The correct answer is ${currentDriver}. Your score is ${score}.`;
        resultElement.style.color = 'red';
    }

    document.querySelectorAll('#options button').forEach(button => {
        button.disabled = true;
    });

    nextQuestionButton.style.display = 'inline-block';
}

function showLeaderboard() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'block';
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    leaderboard.sort((a, b) => b.score - a.score);
    
    leaderboard.forEach((entry, index) => {
        const listItem = document.createElement('div');
        listItem.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
        leaderboardList.appendChild(listItem);
    });
}

function backToMenu() {
    document.getElementById('leaderboard-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
}

document.getElementById('next-question').addEventListener('click', nextQuestion);
document.getElementById('play-button').addEventListener('click', startGame);
document.getElementById('leaderboard-button').addEventListener('click', showLeaderboard);
document.getElementById('back-to-menu').addEventListener('click', backToMenu);

// Интеграция с Telegram Mini App
window.Telegram.WebApp.ready();

const tg = window.Telegram.WebApp;

// Обновление темы в соответствии с настройками Telegram
const isDarkMode = tg.colorScheme === 'dark';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

// Функция для сохранения результата в таблицу лидеров
function saveScore() {
    const username = tg.initDataUnsafe.user.username || 'Anonymous';
    leaderboard.push({ username, score });
    
    // Здесь можно добавить код для отправки результата на сервер
    // Например, использовать fetch для отправки POST-запроса
}

// Функция для завершения игры
function endGame() {
    saveScore();
    tg.showAlert(`Game Over! Your final score is ${score}.`);
    backToMenu();
}

// Обновляем функцию checkAnswer
function checkAnswer(selectedDriver) {
    const resultElement = document.getElementById('result');
    const nextQuestionButton = document.getElementById('next-question');

    if (selectedDriver === currentDriver) {
        score++;
        resultElement.textContent = `Correct! Your score is ${score}.`;
        resultElement.style.color = 'green';
    } else {
        resultElement.textContent = `Wrong. The correct answer is ${currentDriver}. Your score is ${score}.`;
        resultElement.style.color = 'red';
        endGame();
        return;
    }

    document.querySelectorAll('#options button').forEach(button => {
        button.disabled = true;
    });

    nextQuestionButton.style.display = 'inline-block';
}

async function saveScore() {
    const username = tg.initDataUnsafe.user.username || 'Anonymous';
    try {
        const response = await fetch('https://your-api-url.com/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, score }),
        });
        if (!response.ok) {
            throw new Error('Failed to save score');
        }
        const data = await response.json();
        console.log('Score saved successfully:', data);
    } catch (error) {
        console.error('Error saving score:', error);
        tg.showAlert('Failed to save your score. Please try again later.');
    }
}

// Функция для загрузки таблицы лидеров
async function loadLeaderboard() {
    try {
        const response = await fetch('https://your-api-url.com/leaderboard');
        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }
        const data = await response.json();
        leaderboard = data;
        showLeaderboard();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        tg.showAlert('Failed to load leaderboard. Please try again later.');
    }
}

// Обновляем функцию initApp
function initApp() {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'none';

    loadLeaderboard();
}

// Запуск приложения
initApp();
