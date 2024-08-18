const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = process.env.TELEGRAM_BOT_TOKEN;
const githubToken = process.env.GH_TOKEN;
const gistId = process.env.GIST_ID;

const bot = new TelegramBot(token, {polling: true});

const drivers = [
    "Lewis Hamilton", "George Russell", "Max Verstappen", "Sergio Perez",
    "Charles Leclerc", "Carlos Sainz", "Lando Norris", "Oscar Piastri",
    "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Pierre Gasly",
    "Yuki Tsunoda", "Daniel Ricciardo", "Valtteri Bottas", "Zhou Guanyu",
    "Kevin Magnussen", "Nico Hulkenberg", "Alexander Albon", "Logan Sargeant"
];

const games = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome to F1 Driver Challenge! Use /play to start a new game.");
});

bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    games[chatId] = { score: 0, currentDriver: null };
    nextQuestion(chatId);
});

function nextQuestion(chatId) {
    const game = games[chatId];
    game.currentDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const options = getRandomOptions(game.currentDriver);

    const keyboard = {
        reply_markup: {
            keyboard: options.map(option => [{text: option}]),
            one_time_keyboard: true
        }
    };

    bot.sendMessage(chatId, `Who is this driver?`, keyboard);
    // Note: In a real scenario, you would send a photo of the driver here
    // bot.sendPhoto(chatId, `path_to_image/${game.currentDriver}.jpg`);
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

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const game = games[chatId];

    if (!game || !game.currentDriver) return;

    if (msg.text === game.currentDriver) {
        game.score++;
        bot.sendMessage(chatId, `Correct! Your score is ${game.score}.`);
        nextQuestion(chatId);
    } else {
        bot.sendMessage(chatId, `Wrong. The correct answer is ${game.currentDriver}. Your final score is ${game.score}.`);
        saveScore(msg.from.username || msg.from.first_name, game.score);
        delete games[chatId];
    }
});

async function saveScore(username, score) {
    try {
        const leaderboard = await getLeaderboard();
        const existingEntry = leaderboard.find(entry => entry.username === username);
        
        if (existingEntry) {
            existingEntry.score = Math.max(existingEntry.score, score);
        } else {
            leaderboard.push({ username, score });
        }
        
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);

        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    'leaderboard.json': {
                        content: JSON.stringify(top10)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save score');
        }
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

async function getLeaderboard() {
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        return JSON.parse(data.files['leaderboard.json'].content);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

bot.onText(/\/leaderboard/, async (msg) => {
    const chatId = msg.chat.id;
    const leaderboard = await getLeaderboard();
    const leaderboardText = leaderboard.map((entry, index) => 
        `${index + 1}. ${entry.username}: ${entry.score}`
    ).join('\n');
    bot.sendMessage(chatId, `Leaderboard:\n${leaderboardText}`);
});

console.log('Bot is running...');
