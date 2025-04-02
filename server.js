const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());

// Кэш директория
const CACHE_DIR = path.join(__dirname, 'cache');

// Создаем кэш директорию, если она не существует
async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating cache directory:', err);
    }
}

ensureCacheDir();

// Список популярных игр
const popularGames = [
    { appid: 730, name: 'Counter-Strike: Global Offensive' },
    { appid: 570, name: 'Dota 2' },
    { appid: 440, name: 'Team Fortress 2' },
    { appid: 230, name: 'Divinity: Original Sin' },
    { appid: 292030, name: 'The Witcher 3: Wild Hunt' },
    { appid: 1245620, name: 'Elden Ring' },
    { appid: 271590, name: 'Grand Theft Auto V' },
    { appid: 578080, name: "PLAYERUNKNOWN'S BATTLEGROUNDS" },
    { appid: 359550, name: "Tom Clancy's Rainbow Six Siege" },
    { appid: 1174180, name: 'Red Dead Redemption 2' },
    { appid: 489830, name: 'The Elder Scrolls V: Skyrim Special Edition' },
    { appid: 413150, name: 'Stardew Valley' },
    { appid: 72850, name: 'The Elder Scrolls V: Skyrim' },
    { appid: 252490, name: 'Rust' },
    { appid: 1091500, name: 'Cyberpunk 2077' },
    { appid: 105600, name: 'Terraria' },
    { appid: 304930, name: 'Unturned' },
    { appid: 1085660, name: 'Destiny 2' },
    { appid: 39210, name: 'Final Fantasy XIV Online' },
    { appid: 945360, name: 'Among Us' },
    { appid: 1172620, name: 'Sea of Thieves' },
    { appid: 1326470, name: 'Sons Of The Forest' },
    { appid: 431960, name: 'Wallpaper Engine' },
    { appid: 238960, name: 'Path of Exile' },
    { appid: 394360, name: 'Hearts of Iron IV' },
    { appid: 1599340, name: 'Lost Ark' },
    { appid: 582010, name: 'MONSTER HUNTER: WORLD' },
    { appid: 236390, name: 'War Thunder' },
    { appid: 1551360, name: 'Forza Horizon 5' },
    { appid: 1158310, name: 'Call of Duty: Warzone' },
    { appid: 379720, name: 'DOOM' },
    { appid: 374320, name: 'DARK SOULS III' },
    { appid: 227300, name: 'Euro Truck Simulator 2' },
    { appid: 322330, name: "Don't Starve Together" },
    { appid: 1938090, name: 'Call of Duty: Modern Warfare III' },
    { appid: 1817070, name: "Baldur's Gate 3" },
    { appid: 1293830, name: 'Forza Horizon 4' },
    { appid: 289070, name: "Sid Meier's Civilization VI" },
    { appid: 550, name: 'Left 4 Dead 2' },
    { appid: 1063730, name: 'New World' },
    { appid: 242760, name: 'The Forest' },
    { appid: 1086940, name: 'Black Desert' },
    { appid: 377160, name: 'Fallout 4' },
    { appid: 264710, name: 'Subnautica' },
    { appid: 755790, name: 'Ring of Elysium' },
    { appid: 1144200, name: 'Ready or Not' },
    { appid: 244210, name: 'Assetto Corsa' },
    { appid: 255710, name: 'Cities: Skylines' },
    { appid: 252950, name: 'Rocket League' },
    { appid: 49520, name: 'Borderlands 2' },
];

// Получение данных игры с кэшированием
async function getGameDetails(appId) {
    const cacheFile = path.join(CACHE_DIR, `${appId}.json`);

    try {
        // Проверяем кэш сначала
        const cachedData = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(cachedData);
    } catch (err) {
        // Если кэш не найден, пробуем получить из API
        try {
            const response = await axios.get(
                `https://store.steampowered.com/api/appdetails`,
                {
                    params: { appids: appId },
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        Referer: 'https://store.steampowered.com/',
                    },
                },
            );

            // Сохраняем в кэш
            await fs.writeFile(cacheFile, JSON.stringify(response.data));
            return response.data;
        } catch (apiErr) {
            console.error(`API error for game ${appId}:`, apiErr.message);

            // В случае ошибки возвращаем заглушку
            return {
                [appId]: {
                    success: false,
                    data: null,
                },
            };
        }
    }
}

// Маршрут для получения деталей игры
app.get('/api/appdetails', async (req, res) => {
    try {
        const appId = req.query.appids;
        const data = await getGameDetails(appId);
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// API список приложений (используем заранее определенный список)
app.get('/api/steamapps/getapplist/v2', async (req, res) => {
    // Фиксированное общее количество игр
    const totalGames = popularGames.length;

    res.json({
        applist: {
            apps: popularGames,
            total: totalGames,
        },
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
