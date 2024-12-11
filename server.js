const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const selfsigned = require('selfsigned');

const app = express();
const PORT = 8001;

const rooms = {}
const players = {}

const certFile = 'localhost.pem';
const keyFile = 'localhost-key.pem';

console.log('Starting server setup...');

if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
  console.log('Generating self-signed certificates...');
  const pems = selfsigned.generate(null, { days: 365 });
  fs.writeFileSync(certFile, pems.cert);
  fs.writeFileSync(keyFile, pems.private);
  console.log('Certificates generated.');
} else {
  console.log('Certificates already exist.');
}

const options = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

console.log('Creating HTTPS server...');

const server = https.createServer(options, (req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? '/SpaceShooting.html' : req.url);
    const ext = path.extname(filePath);

    const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.css': 'text/css',
        '.ico': 'image/x-icon',
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
    if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404: File Not Found');
        return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
    });
})

const wss = new WebSocket.Server({ server });

function generateClientId() {
    return crypto.randomInt(1e9, 1e10).toString();
}

wss.on('connection', (ws) => {
    const clientId = generateClientId();
    players[clientId] = {"ws": ws, "room": ""}
    console.log('WebSocket client connected with ID: ' + clientId);

    data = {
        "type": "connected",
        "id": clientId
    }

    ws.send(JSON.stringify(data));

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        message_json = JSON.parse(message)
        type = message_json["type"]

        if (type == "update"){
            rooms[players[clientId]["room"]]["Players"][clientId]["x"] = message_json["x"]
            rooms[players[clientId]["room"]]["Players"][clientId]["y"] = message_json["y"]
            rooms[players[clientId]["room"]]["Players"][clientId]["angle"] = message_json["angle"]
            rooms[players[clientId]["room"]]["Players"][clientId]["animation"] = message_json["animation"]
            for (let player in rooms[players[clientId]["room"]]["Players"]){
                if (player != clientId){
                    const data = {
                        "type": "update",
                        "Players": rooms[players[clientId]["room"]]["Players"],
                        "Enemies": rooms[players[clientId]["room"]]["Enemies"]
                    };
                    players[player]["ws"].send(JSON.stringify(data))
                }
            }
        } else if (type == "join"){
            data = {
                "type": "add_player",
                "id": clientId,
                "x": 100,
                "y": 100,
                "angle": 0
            }
            ws.send(JSON.stringify(data))
            roomId = message_json["room"]
            players[clientId]["room"] = roomId
            if (rooms[roomId]){
                playerData = {
                    "x": 100,
                    "y": 100,
                    "angle": 0,
                    "animation": "default"
                }
                rooms[roomId]["Players"][clientId] = playerData
            } else {
                roomData = {
                    "Players": {},
                    "Enemies": {}
                }
                rooms[roomId] = roomData
                playerData = {
                    "x": 100,
                    "y": 100,
                    "angle": 0,
                    "animation": "default"
                }
                rooms[roomId]["Players"][clientId] = playerData
            }
            console.log(clientId + " joining room " + message_json["room"])
            console.log(JSON.stringify(rooms))

            data = {
                "type": "update",
                "Players": rooms[roomId]["Players"],
                "Enemies": rooms[roomId]["Enemies"]
            }
            setTimeout(function() {ws.send(JSON.stringify(data))}, 200);          
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket client ${clientId} disconnected`);

        const roomId = players[clientId]["room"];
        if (rooms[roomId]) {
            delete rooms[roomId]["Players"][clientId]; // Remove o jogador da sala
            if (Object.keys(rooms[roomId]["Players"]).length === 0) {
                delete rooms[roomId]; // Remove a sala se estiver vazia
            }
        }

        delete players[clientId];
    });
});

server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const selfsigned = require('selfsigned');

const app = express();
const PORT = 8001;

const rooms = {}
const players = {}

const certFile = 'localhost.pem';
const keyFile = 'localhost-key.pem';

console.log('Starting server setup...');

if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
  console.log('Generating self-signed certificates...');
  const pems = selfsigned.generate(null, { days: 365 });
  fs.writeFileSync(certFile, pems.cert);
  fs.writeFileSync(keyFile, pems.private);
  console.log('Certificates generated.');
} else {
  console.log('Certificates already exist.');
}

const options = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

console.log('Creating HTTPS server...');

const server = https.createServer(options, (req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? '/SpaceShooting.html' : req.url);
    const ext = path.extname(filePath);

    const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.css': 'text/css',
        '.ico': 'image/x-icon',
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
    if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404: File Not Found');
        return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
    });
})

const wss = new WebSocket.Server({ server });

function generateClientId() {
    return crypto.randomInt(1e9, 1e10).toString();
}

wss.on('connection', (ws) => {
    const clientId = generateClientId();
    players[clientId] = {"ws": ws, "room": ""}
    console.log('WebSocket client connected with ID: ' + clientId);

    data = {
        "type": "connected",
        "id": clientId
    }

    ws.send(JSON.stringify(data));

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        message_json = JSON.parse(message)
        type = message_json["type"]

        if (type == "update"){
            rooms[players[clientId]["room"]]["Players"][clientId]["x"] = message_json["x"]
            rooms[players[clientId]["room"]]["Players"][clientId]["y"] = message_json["y"]
            rooms[players[clientId]["room"]]["Players"][clientId]["angle"] = message_json["angle"]
            rooms[players[clientId]["room"]]["Players"][clientId]["animation"] = message_json["animation"]
            for (let player in rooms[players[clientId]["room"]]["Players"]){
                if (player != clientId){
                    const data = {
                        "type": "update",
                        "Players": rooms[players[clientId]["room"]]["Players"],
                        "Enemies": rooms[players[clientId]["room"]]["Enemies"]
                    };
                    players[player]["ws"].send(JSON.stringify(data))
                }
            }
        } else if (type == "audio"){
            try {
                for (let player in rooms[players[clientId]["room"]]["Players"]){
                    console.log("Sending audio")
                    if (player != clientId){
                        const data = {
                            "type": "audio",
                            "audio": message_json["audio"]
                        };
                        players[player]["ws"].send(JSON.stringify(data))
                    }
                }
            } catch (error) {
                
            }
            
        } else if (type == "join"){
            roomId = message_json["room"]
            data = {
                "type": "add_player",
                "id": clientId,
                "x": 100,
                "y": 100,
                "angle": 0
            }
            ws.send(JSON.stringify(data))
            players[clientId]["room"] = roomId
            if (rooms[roomId]){
                playerData = {
                    "x": 100,
                    "y": 100,
                    "angle": 0,
                    "animation": "default"
                }
                rooms[roomId]["Players"][clientId] = playerData
            } else {
                roomData = {
                    "Players": {},
                    "Enemies": {}
                }
                rooms[roomId] = roomData
                playerData = {
                    "x": 100,
                    "y": 100,
                    "angle": 0,
                    "animation": "default"
                }
                rooms[roomId]["Players"][clientId] = playerData
            }
            console.log(clientId + " joining room " + message_json["room"])
            console.log(JSON.stringify(rooms))

            data = {
                "type": "update",
                "Players": rooms[roomId]["Players"],
                "Enemies": rooms[roomId]["Enemies"]
            }
            setTimeout(function() {ws.send(JSON.stringify(data))}, 200);          
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket client ${clientId} disconnected`);

        const roomId = players[clientId]["room"];
        if (rooms[roomId]) {
            delete rooms[roomId]["Players"][clientId]; // Remove o jogador da sala
            if (Object.keys(rooms[roomId]["Players"]).length === 0) {
                delete rooms[roomId]; // Remove a sala se estiver vazia
            } else {
                for (let player in rooms[roomId]["Players"]){
                    const data = {
                        "type": "disconnected",
                        "player": clientId
                    };
                    players[player]["ws"].send(JSON.stringify(data))
                }
            }
        }

        delete players[clientId];
    });
});

server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
