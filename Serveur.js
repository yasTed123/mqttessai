
const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const DataModel = require(path.join(__dirname, 'models', 'DataModel'));


// Connexion à MQTT
const client = mqtt.connect('mqtt://192.168.0.182:1883');
client.on('connect', () => {
  client.subscribe('esp8266/mq135');
});

// Connexion à MongoDB
mongoose.connect('mongodb://localhost/mqtt', { useNewUrlParser: true });

// Écoute des messages MQTT et insertion dans MongoDB
// Définir un objet data vide par défaut
let data = {};

client.on('message', function (topic, message) {
    // Traiter le message ici et mettre à jour la variable data si nécessaire
    data.field1 = "valeur"; // Exemple de définition d'une propriété field1 dans l'objet data

    // Utiliser la variable data après l'avoir définie
    console.log("Valeur de field1 : " + data.field1);
});



  
  // Création d'une nouvelle instance du modèle de données
  const newData = new DataModel({
    field1: data.field1,
    field2: data.field2
  });

  // Sauvegarde des données dans MongoDB
  newData.save()
    .then(() => {
      console.log('Données insérées avec succès dans MongoDB');
    })
    .catch(err => {
      console.error('Erreur lors de insertion des données dans MongoDB : ', err);
    });

// Démarrez le serveur Express
const app = express();
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend en cours d'exécution sur le port ${PORT}`);
});



const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const DataModel = require(path.join(__dirname, 'models', 'DataModel'));


// Connexion à MQTT
const client = mqtt.connect('mqtt://192.168.0.182:1883');
client.on('connect', () => {
  client.subscribe('esp8266/mq135');
});

// Connexion à MongoDB
mongoose.connect('mongodb://localhost/mqtt', { useNewUrlParser: true });

// Écoute des messages MQTT et insertion dans MongoDB
// Définir un objet data vide par défaut
let data = {};

client.on('message', function (topic, message) {
    // Traiter le message ici et mettre à jour la variable data si nécessaire
    data.field1 = "valeur"; // Exemple de définition d'une propriété field1 dans l'objet data

    // Utiliser la variable data après l'avoir définie
    console.log("Valeur de field1 : " + data.field1);
});



  
  // Création d'une nouvelle instance du modèle de données
  const newData = new DataModel({
    field1: data.field1,
    field2: data.field2
  });

  // Sauvegarde des données dans MongoDB
  newData.save()
    .then(() => {
      console.log('Données insérées avec succès dans MongoDB');
    })
    .catch(err => {
      console.error('Erreur lors de insertion des données dans MongoDB : ', err);
    });

// Démarrez le serveur Express
const app = express();
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend en cours d'exécution sur le port ${PORT}`);
});                       
