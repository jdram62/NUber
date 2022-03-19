//Rider.js
var mongoose = require('mongoose');
var RiderSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    location: {
        lat: String,
        lon: String
    },
    destination: String,
    savedDestination: {
        home: String,
        saved1: String,
        saved2: String
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
});
mongoose.model('Rider', RiderSchema);
module.exports = mongoose.model('Rider');
