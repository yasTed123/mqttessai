const mosca = require('mosca');

const settings = {
  port: 1883,  // Port MQTT
};

const server = new mosca.Server(settings);

server.on('ready', () => {
  console.log('Serveur MQTT prêt sur le port', settings.port);
});

server.on('published', (packet, client) => {
  if (packet.topic === 'esp8266/data') {
    const message = packet.payload.toString();
    console.log('Message reçu :', message);
    // Faites ce que vous voulez avec le message reçu ici
  }
});
