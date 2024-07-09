const drivers = [
    "Lewis Hamilton", "George Russell", "Max Verstappen", "Sergio Perez",
    "Charles Leclerc", "Carlos Sainz", "Lando Norris", "Oscar Piastri",
    "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Pierre Gasly",
    "Yuki Tsunoda", "Nyck de Vries", "Valtteri Bottas", "Zhou Guanyu",
    "Kevin Magnussen", "Nico Hulkenberg", "Alexander Albon", "Logan Sargeant"
];

let score = 0;
let currentDriver;

function startGame() {
    score = 0;
    nextQuestion();
}

function nextQuestion() {
    document.getElementById('options').innerHTML = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('next-question').style.display = 'none';

    currentDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const options = getRandomOptions(currentDriver);

    document.getElementById('question').textContent = `Who is ${currentDriver}?`;

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

document.getElementById('next-question').addEventListener('click', nextQuestion);

// Интеграция с Telegram Mini App
window.Telegram.WebApp.ready();

window.Telegram.WebApp.MainButton.setText('Start Game').show().onClick(startGame);

// Обновление темы в соответствии с настройками Telegram
const isDarkMode = window.Telegram.WebApp.colorScheme === 'dark';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

// Инициализация игры
startGame();