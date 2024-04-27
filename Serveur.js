// Initialisation des dépendances et configuration
const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const mosca = require('mosca');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs');

// Configuration de MongoDB
const mongoURL = 'mongodb://admin:aymen@13.48.115.61:27017/mydatabase?directConnection=true&appName=mongosh+2.2.4';
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
const dataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    force: Number,
    sensor_id: String,
    description: String,
    data: String
});
const DataModel = mongoose.model('Data', dataSchema);

// Serveur HTTP
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/update') {
        if (req.method === 'GET') {
            const temp = parseFloat(parsedUrl.query.temp);
            const humidity = parseFloat(parsedUrl.query.humidity);
            const force = parseInt(parsedUrl.query.force);
            console.log('Temperature:', temp, '°C');
            console.log('Humidity:', humidity, '%');
            console.log('Force:', force);
            const newData = new DataModel({ temperature: temp, humidity: humidity, force: force });
            newData.save()
                .then(() => {
                    console.log('Data saved to MongoDB successfully');
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Data received and saved successfully');
                })
                .catch(err => {
                    console.error('Failed to save data to MongoDB:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                });
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    } else if (parsedUrl.pathname === '/sensorData') {
        DataModel.findOne().sort({ $natural: -1 }).exec()
            .then(data => {
                if (!data) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Sensor data not found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
            })
            .catch(err => {
                console.error('Failed to retrieve sensor data from MongoDB:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            });
    } else if (parsedUrl.pathname === '/') {
        const filePath = path.join(__dirname, 'index1.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Failed to read HTML file:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (parsedUrl.pathname === '/index1.html') {
        const filePath = path.join(__dirname, 'index1.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Failed to read HTML file:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});
const port = 8000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// Serveur MQTT
const mqttSettings = { port: 1883 };
const mqttServer = new mosca.Server(mqttSettings);
mqttServer.on('ready', () => {
    console.log("Broker Mosca démarré sur le port", mqttSettings.port);
});
mqttServer.on('clientConnected', (client) => {
    console.log('Client connecté:', client.id);
});
mqttServer.on('published', (packet, client) => {
    if (packet.topic.indexOf('$SYS') === -1) {
        const payload = packet.payload.toString(); // Convertir la charge utile en chaîne de caractères
        console.log('Message publié:', payload);

        // Insérer les données dans MongoDB
        const newData = new DataModel({ // Utilisation de newData déclaré plus haut
            timestamp: new Date(),
            data: payload
        });

        newData.save()
            .then(() => console.log('Données insérées dans MongoDB'))
            .catch(err => console.error('Erreur lors de l\'insertion des données dans MongoDB:', err));
    }
});


// Client MQTT
const client = mqtt.connect('mqtt://13.48.115.61:1883');
client.on('connect', () => {
    client.subscribe('esp8266/mq135');
});



// Serveur WebSocket
const wss = new WebSocket.Server({ port:3030 });
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify(newData));
});

// Serveur Express
const app = express();
const PORT = 3000;
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index1.html'));
});
app.listen(PORT, () => {
    console.log(`Serveur backend en cours d'exécution sur le port ${PORT}`);
});
