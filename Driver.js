//Driver.js
var mongoose = require('mongoose');
var DriverSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    location: {
        lat: String,
        lon: String
    },
    available: Boolean,
    assignedRider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider'
    },
    rating: Number,
    ratingCount : Number
});

mongoose.model('Driver', DriverSchema);
module.exports = mongoose.model('Driver');

