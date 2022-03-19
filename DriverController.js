//DriverController.js
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var Driver = require('./Driver');
var Rider = require('./Rider');

/*  Drivers can be created
    POST localhost:3000/driver/
    example JSON body:
    {
        "firstName": "driveName",
        "lastName": "last",
        "location": {
            "lat": "30.474790",
            "lon": "-97.839910"
        },
        "available": true,
        "assignedRider": null,
        "rating" : "4.5",
        "ratingCount" : "50"
    }
*/
router.post('/', function (req, res) {
    Driver.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            location: req.body.location,
            available : req.body.available,
            assignedRider : req.body.assignedRider,
            rating : req.body.rating,
            ratingCount : req.body.ratingCount
        },
        function (err, driver) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(driver);
        });
});

/*
    Drivers can update their availability
    PUT localhost:3000/driver/driveId/availability
    example JSON body:
    {
        "available": true
    }
*/
router.put('/:id/availability', function (req, res) {
    Driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, driver) {
        if (!driver) return res.status(500).send("Driver cannot be found.");
        res.status(200).send(driver);
    });
});

/*
    Drivers can update their location
    PUT localhost:3000/driver/driverId/location
    example JSON body:
    {
        "location" : {
            "lat" : "1",
            "lon" : "-1"
        }
    }
*/
router.put('/:id/location', function (req, res) {
    Driver.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, driver) {
        if (!driver) return res.status(500).send("Driver cannot be found.");
        let location_check = req.body['location'];
        if(!location_check) return res.status(500).send("Incorrect body params.");
        let location = driver.location;
        let lat_check = location['lat'];
        let lon_check = location['lon'];
        if(!lat_check || !lon_check) return res.status(500).send("Incorrect body params.");
        res.status(200).send(driver);
    });
});

// Drivers can be accessed
// GET localhost:3000/driver/driverID
router.get('/:id', function (req, res) {
    Driver.findById(req.params.id, function (err, driver) {
        if (!driver) return res.status(500).send("Driver cannot be found.");
        res.status(200).send(driver);
    });
});

// Drivers can see assigned Riders destination
// GET localhost:3000/driver/driverID/assignedRider/destination
router.get('/:id/assignedRider/destination', function (req, res) {
    Driver.findById(req.params.id, function (err, driver) {
        if (!driver) return res.status(404).send("Driver cannot be found.");
        let has_rider = driver['assignedRider'];
        if(!has_rider) return res.status(500).send("No assigned rider.");
        Rider.findById(driver.assignedRider, function (err, rider){
            if (!rider) return res.status(404).send("Assigned rider cannot be found.");
            let rider_dest = rider.destination;
            res.status(200).send(rider_dest);
        });
    });
});

// Drivers can see assigned Riders location
// GET localhost:3000/driver/driverID/assignedRider/location
router.get('/:id/assignedRider/location', function (req, res) {
    Driver.findById(req.params.id, function (err, driver) {
        if (!driver) return res.status(404).send("Driver cannot be found.");
        let has_rider = driver['assignedRider'];
        if(!has_rider) return res.status(500).send("No assigned rider.");
        Rider.findById(driver.assignedRider, function (err, rider){
            if (!rider) return res.status(404).send("Assigned rider cannot be found.");
            let r_lat = rider.location.lat;
            let r_lon = rider.location.lon;
            res.status(200).send({'lat': r_lat, 'lon': r_lon});
        });
    });
});

module.exports = router;
