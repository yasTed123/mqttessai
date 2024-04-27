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

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define a schema for the data
const dataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    force: Number,
    sensor_id: String,
    description: String,
    data: String

    
  });
  
// Define a model based on the schema
const DataModel = mongoose.model('Data', dataSchema);

// Create a server HTTP
const server = http.createServer((req, res) => {
     // Analyze the request URL
  const parsedUrl = url.parse(req.url, true); 
  // Check the URL path
  if (parsedUrl.pathname === '/update') {
    // Check if the HTTP method is GET
    if (req.method === 'GET') {
      // Retrieve temperature, humidity, and force data from URL parameters
      const temp = parseFloat(parsedUrl.query.temp);
      const humidity = parseFloat(parsedUrl.query.humidity);
      const force = parseInt(parsedUrl.query.force);

      // Display received data in the server console
      console.log('Temperature:', temp, '°C');
      console.log('Humidity:', humidity, '%');
      console.log('Force:', force);

      // Create a new document instance
      const newData = new DataModel({ temperature: temp, humidity: humidity, force: force });

      // Save the data to MongoDB
      newData.save()
        .then(() => {
          console.log('Data saved to MongoDB successfully');
          // Send an HTTP response to the client
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Data received and saved successfully');
        })
        .catch(err => {
          console.error('Failed to save data to MongoDB:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        });
    } else {
      // If the HTTP method is not GET, return an error
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } else if (parsedUrl.pathname === '/sensorData') {
    // Serve the latest sensor data as JSON
    DataModel.findOne().sort({$natural:-1}).exec() // Utilisation de la promesse
      .then(data => {
        if (!data) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Sensor data not found');
        } else {
          // Send the sensor data as JSON response
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
    // Serve the HTML page
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
    // Serve the sensor data HTML page
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
    // If the URL is not handled, return a 404 error
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Define the port on which the server will listen
const port = 8000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Configuration du broker MQTT
const mqttSettings = {
    port: 1883 // Port du broker MQTT
};

// Création du serveur MQTT
const mqttServer = new mosca.Server(mqttSettings);

// Événement lorsque le serveur MQTT est prêt
mqttServer.on('ready', () => {
    console.log("Broker Mosca démarré sur le port", mqttSettings.port);
});

// Événement lorsqu'un client MQTT se connecte
mqttServer.on('clientConnected', (client) => {
    console.log('Client connecté:', client.id);
});

let newData

// Événement lorsqu'un message MQTT est publié
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

// Connexion à MQTT
const client = mqtt.connect('mqtt://13.48.115.61 :1883');
client.on('connect', () => {
    client.subscribe('esp8266/mq135');
});

// Créer un serveur WebSocket
    const wss = new WebSocket.Server({ port: 8080 });

// Écouter les connexions WebSocket

    // Écouter les connexions WebSocket
    wss.on('connection', function connection(ws) {
        console.log('Client connected');

        // Envoyer les données initiales au client WebSocket lors de la connexion
        ws.send(JSON.stringify(newDat)); // Utilisation de newData déclaré plus haut
    });

// Écoute des messages MQTT
client.on('message', function (topic, message) {
    // Convertir le message brut en chaîne de caractères
    const messageString = message.toString();

    // Extraire la valeur du capteur à partir du message
    const sensorValueIndex = messageString.indexOf(':') + 1;
    const sensorValue = messageString.substring(sensorValueIndex).trim();

    // Créer un objet JSON avec la valeur du capteur
    const data = {
        field1: "niveau de gaz: ",
        value: parseInt(sensorValue)
    };

    // Enregistrer les nouvelles données dans MongoDB
    newData = new DataModel({ // Utilisation de newData déclaré plus haut
        field1: data.field1,
        value: data.value
    });

    // Sauvegarde des données dans MongoDB
    newData.save()
        .then(() => {
            console.log('Données insérées avec succès dans MongoDB');
        })
        .catch(err => {
            console.error('Erreur lors de insertion des données dans MongoDB : ', err);
        });

    // Envoyer les données mises à jour aux clients WebSocket connectés
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });

    // Utilisez les données après les avoir mises à jour
    console.log("Valeurs du capteur mises à jour : ", data);
});

// Initialiser le serveur Express
const app = express();
const PORT = 3000;

// Servir la page HTML pour afficher les valeurs du capteur
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

// Démarrer le serveur Express
app.listen(PORT, () => {
    console.log(`Serveur backend en cours d'exécution sur le port ${PORT}`);
});
