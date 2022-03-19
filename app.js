// app.js
var express = require('express');

var RiderController = require('./RiderController');
var DriverController = require('./DriverController');

var app = express();
var db = require('./db');

app.use('/rider', RiderController);
app.use('/driver', DriverController);

module.exports = app;