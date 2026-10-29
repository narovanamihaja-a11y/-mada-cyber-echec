// server.js - Production Ready for Cloud Deployment
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Dynamically use the port provided by Render or default to 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    let urlPath = req.url === '/' ? '/index.html' : req.url;
    let filePath = path.join(__dirname, urlPath);
    let extname = path.extname(filePath);
    let contentType = 'text/html';

    if (extname === '.css') contentType = 'text/css';
    if (extname === '.js') contentType = 'application/javascript';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', (ws) => {
    if (clients.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room Full!' }));
        ws.close();
        return;
    }
    clients.push(ws);
    const color = clients.length === 1 ? 'W' : 'B';
    ws.send(JSON.stringify({ type: 'init', color: color }));

    if (clients.length === 2) {
        clients.forEach(c => c.send(JSON.stringify({ type: 'start' })));
    }

    ws.on('message', (message) => {
        try {
            let msgObj = JSON.parse(message.toString());
            clients.forEach(c => {
                if (c !== ws && c.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msgObj));
            });
        } catch (e) {
            console.error("Data error:", e);
        }
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==============================================`);
    console.log(`   MADA-MIH-ECHEC // LIVE PRODUCTION SERVER`);
    console.log(`==============================================`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`==============================================\n`);
});
