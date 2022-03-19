//RiderController.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Rider = require('./Rider');
const Driver = require('./Driver');
const request = require('request');

// Riders can be accessed
// GET localhost:3000/rider/:id
router.get('/:id', function (req, res) {
    Rider.findById(req.params.id, function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        res.status(200).send(rider);
    });
});

// Riders can see all available drivers within 10 miles
// GET localhost:3000/rider/:id/nearbyDrivers
router.get('/:id/nearbyDrivers', function (req, res) {
    let drivers_to_return = [];
    let requests = 0;
    Rider.findById(req.params.id, async function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let r_lat = rider.location.lat;
        let r_lon = rider.location.lon;
        let drivers = await Driver.find({}, function (err, drivers) {
            if (drivers.length == 0) res.status(404).send("No drivers found.");
        });
        let promise = new Promise(function (resolve, reject) {
            for (let i = 0; i < drivers.length; i++) {
                let d_lat = drivers[i].location.lat;
                let d_lon = drivers[i].location.lon;
                let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${r_lat},${r_lon}&destinations=${d_lat},${d_lon}&key=AIzaSyBjwkiWLf7SkNT_uMoIzEjGXoU3_RAOvgg`;
                request(url, {json: true}, function (err, r, body) {
                    if (err) res.status(500).send("Internal error.");
                    let text = JSON.stringify(body.rows[0].elements[0].distance.text);
                    let num = text.replace(/"/g, '').replace(/,/ ,'').replace(' ', '').replace("mi", '');
                    if ((num.includes("ft") || num < 10) && (drivers[i].available == true)) {
                        drivers_to_return.push(drivers[i]);
                    }
                    requests++;
                    if (requests == drivers.length) resolve();
                });
            };
        });
        promise.then(() => {
            if (drivers_to_return.length == 0) return res.status(404).send("No drivers found.");
            res.status(200).send(drivers_to_return);
        });
    });
});

// Riders can see all available drivers within a variable distance up to 50 miles
// GET localhost:3000/rider/RiderId/nearbyDrivers/distance
router.get('/:id/nearbyDrivers/:distance', function (req, res) {
    let drivers_to_return = [];
    let requests = 0;
    let distance;
    Rider.findById(req.params.id, async function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let r_lat = rider.location.lat;
        let r_lon = rider.location.lon;
        let drivers = await Driver.find({}, function (err, drivers) {
            if (drivers.length == 0) res.status(404).send("No drivers found.");
        });
        let promise = new Promise(function (resolve, reject) {
            for (let i = 0; i < drivers.length; i++) {
                let d_lat = drivers[i].location.lat;
                let d_lon = drivers[i].location.lon;
                let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${r_lat},${r_lon}&destinations=${d_lat},${d_lon}&key=AIzaSyBjwkiWLf7SkNT_uMoIzEjGXoU3_RAOvgg`;
                request(url, {json: true}, function (err, r, body) {
                    if (err) res.status(500).send("Internal error.");
                    let text = JSON.stringify(body.rows[0].elements[0].distance.text);
                    let num = text.replace(/"/g, '').replace(/,/ ,'').replace(' ', '').replace("mi", '');
                    // If distance isn't null set to the parameter unless larger than 50 then set to max of 50,
                    // Else set distance to default of 10
                    if (req.params.distance != null) {
                        distance = req.params.distance;
                        if (distance > 50) {
                            distance = 50;
                        }
                    } else distance = 10;
                    if (num.includes("ft") || num < distance && (drivers[i].available == true)) {
                        drivers_to_return.push(drivers[i]);
                    }
                    requests++;
                    if (requests == drivers.length) resolve();
                });
            };
        });
        promise.then(() => {
            if (drivers_to_return.length == 0) return res.status(404).send("No drivers found.");
            res.status(200).send(drivers_to_return);
        });
    });
});

/*
    Riders can select a Driver - Selected driver should be from the returned list of nearby and available drivers
    PUT /rider/riderID/selectDriver
    example JSON body:
    {
        "assignedDriver" : "6086f89d212103c41bdc7e25"
    }
*/
router.put('/:id/selectDriver', function (req, res) {
    Rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, rider) {
        if (err) return res.status(404).send("Driver cannot be found.");
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let driver_check = req.body['assignedDriver'];
        if(!driver_check) return res.status(500).send("Incorrect body params.");
        let driver = rider.assignedDriver;
        Driver.findByIdAndUpdate(driver, {available: false, assignedRider: rider._id}, {new: true}, function (err, driver) {
            if (err) res.status(404).send("Driver cannot be found.");
            res.status(200).send(rider);
        });
    });
});

// Riders can see where their selected Driver is
// GET localhost:3000/rider/:id/driverLocation
router.get('/:id/driverLocation', function (req, res) {
    Rider.findById(req.params.id, function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let has_driver = rider['assignedDriver'];
        if(!has_driver) return res.status(500).send("No assigned driver.");
        Driver.findById(rider.assignedDriver, function (err, driver) {
            if (!driver) return res.status(404).send("Assigned driver cannot be found.");
            let d_lat = driver.location.lat;
            let d_long = driver.location.lon;
            let response = `lat: ${d_lat}\nlong: ${d_long}`;
            res.status(200).send(response);
        });
    });
});

/*
    Riders can set their destination
    PUT localhost:3000/rider/:id/destination
    example JSON body:
    {
        "destination" : "123 1st Street"
    }
*/
router.put('/:id/destination', function (req, res) {
    Rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let dest_check = req.body['destination'];
        if(!dest_check) return res.status(500).send("Incorrect body params.");
        res.status(200).send(rider);
    });
});

/*
    Riders can update their location
    PUT localhost:3000/rider/RiderId/location
    example JSON body:
    {
        "location" : {
            "lat" : "1",
            "lon" : "-1"
        }
    }
*/
router.put('/:id/location', function (req, res) {
    Rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        let location_check = req.body['location'];
        if(!location_check) return res.status(500).send("Incorrect body params.");
        let location = rider.location;
        let lat_check = location['lat'];
        let lon_check = location['lon'];
        if(!lat_check || !lon_check) return res.status(500).send("Incorrect body params.");
        res.status(200).send(rider);
    });
});

/* Riders can be created
 POST localhost:3000/rider/

Example JSON
{
    "firstName": "First",
    "lastName": "Rider",
    "location": {
        "lat": "30.474790",
        "lon": "-97.839910"
    },
    "destination": "Yellow Brick Road",
    "savedDestination": {
        "home": "Not Kansas",
        "saved1": "SOMEWHERE",
        "saved2": "Over the Rainbow"
    },
    "assignedDriver": null
}
 */
router.post('/', function (req, res) {
    Rider.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            location : req.body.location,
            destination: req.body.destination,
            assignedDriver : req.body.assignedDriver,
            savedDestination : req.body.savedDestination
        },
        function (err, rider) {
            if (err) return res.status(500).send("Rider could not be created.");
            res.status(200).send(rider);
        });
});

// Riders can have saved destinations
// GET localhost:3000/rider/RiderId/savedDestination/:selection
// selection needs to be home, saved1, or saved2
router.get('/:id/savedDestination/:selection', function (req, res) {
    Rider.findById(req.params.id, function (err, rider) {
        let variable2 = req.params.selection;
        if (!rider) return res.status(404).send("Rider cannot be found.");
        if (variable2 === "home") return res.status(200).send(rider.savedDestination.home);
        if (variable2 === "saved1") return res.status(200).send(rider.savedDestination.saved1);
        if (variable2 === "saved2") return res.status(200).send(rider.savedDestination.saved2);
        res.status(500).send("No such saved destination.")
    });
});

/*
    Riders can change saved destinations
    PUT localhost:3000/rider/RiderId/savedDestination/
    Example JSON
    {
        "savedDestination": {
            "home" : "something else",
            "saved1" : null,
            "saved2" : null
        }
    }
*/
router.put('/:id/savedDestination', function (req, res) {
    Rider.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        res.status(200).send(rider);
    });
});

/*
    Riders can rate Drivers, will average out
    PUT localhost:3000/rider/DriverId/ratingUpdate
    Example JSON
    {
        "rating" : **"0 - 5"**
    }
*/
router.put('/:id/ratingUpdate', function (req, res) {
    Driver.findById(req.params.id, function (err, driver) {
        if (err) return res.status(404).send("Driver cannot be found.");
        let rate_check = req.body['rating'];
        if ( rate_check > 5 || rate_check < 0) return res.status(500).send("Incorrect rating. Input 0 - 5");
        let newRating = ((driver.rating * driver.ratingCount) + req.body['rating']) / (driver.ratingCount + 1); //(total rating + newRate) / (rCount + 1) = newRating
        newRating = newRating.toFixed(2); // Putting it to 2 decimal places
        let newRatingCount = driver.ratingCount + 1;
        Driver.findByIdAndUpdate(req.params.id,{rating: newRating , ratingCount: newRatingCount}, {new: true}, function (err, driver){
            if (!driver) return res.status(404).send("Driver cannot be found.");
            res.status(200).send("New rating is " + driver.rating);
        });
    });
});

// Riders retrieve Driver Ratings
// GET localhost:3000/rider/DriverId/rating
router.get('/:id/rating', function (req, res) {
    Driver.findById(req.params.id, function (err, driver) {
        if (!driver) return res.status(404).send("Driver cannot be found.");
        let response = `Rating: ${driver.rating}`;
        res.status(200).send(response);
    });
});

// Riders retrieve if Driver is in proximity
// GET localhost:3000/rider/RiderId/confirmLocation
// Ensure that either the lat or lon is within 0.0001 from driver to rider or it will be outside 30 ft.
router.get('/:id/confirmLocation', function(req,res) {
    Rider.findById(req.params.id, async function (err, rider) {
        if (!rider) return res.status(404).send("Rider cannot be found.");
        if (rider.assignedDriver == null) return res.status(404).send("Does not have an assigned driver.");
        let r_lat = rider.location.lat;
        let r_lon = rider.location.lon;
        let selectedDriver = rider.assignedDriver;
        Driver.findById(selectedDriver, function (err, driver) {
            if (!driver) return res.status(404).send("Driver cannot be found.");
            let d_lat = driver.location.lat;
            let d_lon = driver.location.lon;
            let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${r_lat},${r_lon}&destinations=${d_lat},${d_lon}&key=AIzaSyBjwkiWLf7SkNT_uMoIzEjGXoU3_RAOvgg`;
            request(url, {json: true}, function (err, r, body) {
                if (err) res.status(500).send("Internal error.");
                let text = JSON.stringify(body.rows[0].elements[0].distance.text);
                let num = text.replace(/"/g, '').replace(/,/, '').replace(' ', '').replace( "ft", '');
                num = Number(num)
                if ((Number(num) <= 30 && text.includes("ft"))) {
                    res.status(200).send("Driver is nearby! Within " + text + ", take a look!");
                }
                else res.status(404).send("Driver is not in your vicinity!!! Currently " + text + " away.");
            });
        });
    });
});

module.exports = router;
