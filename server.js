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
  730, 570, 440, 230, 292030, 1245620, 271590, 578080, 359550, 1174180,
  489830, 413150, 72850, 252490, 1091500, 105600, 304930, 1085660, 39210,
  945360, 1172620, 1326470, 431960, 238960, 394360, 1599340, 582010, 236390,
  1551360, 1158310, 379720, 374320, 227300, 322330, 1938090, 1817070, 1293830,
  289070, 550, 1063730, 242760, 1086940, 377160, 264710, 755790, 1144200,
  244210, 255710, 252950, 49520
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
      const response = await axios.get(`https://store.steampowered.com/api/appdetails`, {
        params: { appids: appId },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://store.steampowered.com/'
        }
      });
      
      // Сохраняем в кэш
      await fs.writeFile(cacheFile, JSON.stringify(response.data));
      return response.data;
    } catch (apiErr) {
      console.error(`API error for game ${appId}:`, apiErr.message);
      
      // В случае ошибки возвращаем заглушку
      return { 
        [appId]: {
          success: false,
          data: null
        } 
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
      apps: popularGames.map(appid => ({
        appid,
        name: `Game ${appid}`
      })),
      total: totalGames
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));