const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema ({
sensor_id: String,
description: String,
data:String


});

// Création du modèle
const DataModel = mongoose.model('DataModel', dataSchema);

module.exports = DataModel;