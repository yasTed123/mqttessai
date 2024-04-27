const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const mosca = require('mosca');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

const port = 8000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

const mongoURL = 'mongodb://admin:aymen@13.48.115.61:27017/mydatabase?directConnection=true&appName=mongosh+2.2.4';
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const dataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  force: Number,
  sensor_id: String, // Ajout pour la partie de gaz
  description: String, // Ajout pour la partie de gaz
  data: String // Ajout pour la partie de gaz
});

const DataModel = mongoose.model('Data', dataSchema);

app.get('/update', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === 'GET' && parsedUrl.pathname === '/update') {
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
});

app.get('/sensorData', (req, res) => {
  DataModel.findOne().sort({$natural:-1}).exec()
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
});

app.get('/', (req, res) => {
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
});

const mqttSettings = {
  port: 1883
};

const mqttServer = new mosca.Server(mqttSettings);

mqttServer.on('ready', () => {
  console.log("Broker Mosca démarré sur le port", mqttSettings.port);
});

mqttServer.on('clientConnected', (client) => {
  console.log('Client connecté:', client.id);
});

mqttServer.on('published', (packet, client) => {
  if (packet.topic.indexOf('$SYS') === -1) {
    const payload = packet.payload.toString();
    console.log('Message publié:', payload);

    const newData = new DataModel({
      timestamp: new Date(),
      data: payload
    });

    newData.save()
      .then(() => console.log('Données insérées dans MongoDB'))
      .catch(err => console.error('Erreur lors de l\'insertion des données dans MongoDB:', err));
  }
});

const client = mqtt.connect('mqtt://13.48.115.61:1883');
client.on('connect', () => {
  client.subscribe('esp8266/mq135');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('Client connected');
});

client.on('message', function (topic, message) {
  const messageString = message.toString();
  const sensorValueIndex = messageString.indexOf(':') + 1;
  const sensorValue = messageString.substring(sensorValueIndex).trim();

  const data = {
    field1: "niveau de gaz: ",
    value: parseInt(sensorValue)
  };

  newData = new DataModel({
    field1: data.field1,
    value: data.value
  });

  newData.save()
    .then(() => {
      console.log('Données insérées avec succès dans MongoDB');
    })
    .catch(err => {
      console.error('Erreur lors de insertion des données dans MongoDB : ', err);
    });

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

  console.log("Valeurs du capteur mises à jour : ", data);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend en cours d'exécution sur le port ${PORT}`);
});
