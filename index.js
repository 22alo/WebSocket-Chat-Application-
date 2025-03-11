// Import required modules
const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const port = 3000;



// Serve static files for the client
app.use(express.static('public'));

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });


// Keep track of connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    // Send a welcome message to the connected client
    ws.send(JSON.stringify({ type: 'system', message: 'Welcome to the chat!' }));

    // Handle incoming messages
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        broadcastMessage(message, ws);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
        broadcastMessage(JSON.stringify({ type: 'system', message: 'A user has left the chat.' }), ws);
    });

    // Handle errors
    ws.on('error', (err) => {
        console.error(`Error: ${err.message}`);
    });
});

// Broadcast message to all connected clients
function broadcastMessage(message, sender) {
    clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Simple HTML client (save in 'public/index.html')
const fs = require('fs');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebSocket Chat</title>
</head>
<body>
    <h2>WebSocket Chat</h2>
    <ul id="messages"></ul>
    <input type="text" id="messageInput" placeholder="Type a message..." />
    <button onclick="sendMessage()">Send</button>

    <script>
        const socket = new WebSocket('ws://localhost:${port}');

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            const messagesList = document.getElementById('messages');
            const listItem = document.createElement('li');
            listItem.textContent = message.message;
            messagesList.appendChild(listItem);
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (input.value.trim()) {
                socket.send(JSON.stringify({ type: 'user', message: input.value }));
                input.value = '';
            }
        }
    </script>
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), htmlContent);

