import express from "express";
import mysql from "mysql";
import cors from "cors";

const app = express()
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "d26893.mysql.zonevs.eu",
    user: "d26893_busstops",
    password: "3w7PYquFJhver0!KdOfF",
    database: "d26893_busstops"    
})

app.use(cors())

app.get("/", (req, res) => {
    const q = "SELECT stop_area FROM malkov_bus_stops"
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        else {
            return res.json(data)
        }
    })
}) 

app.get("/:stop_area", (req, res) => {
    const stopArea = req.params.stop_area
    const q = `SELECT stop_name FROM malkov_bus_stops WHERE stop_area = '${stopArea}'`
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        else {
            return res.json(data)
        }
    })
}) 

app.post("/get", (req, res) => {
    const stopArea = req.body.stopArea
    const stopName = req.body.stopName
    const q = `SELECT route_id, route_short_name FROM malkov_bus_routes WHERE malkov_bus_routes.route_id IN ( SELECT malkov_bus_trips.route_id FROM malkov_bus_trips WHERE malkov_bus_trips.trip_id IN( SELECT malkov_bus_times.trip_id FROM malkov_bus_times WHERE malkov_bus_times.stop_id IN( SELECT malkov_bus_stops.stop_id FROM malkov_bus_stops WHERE malkov_bus_stops.stop_name='${stopName}' AND malkov_bus_stops.stop_area='${stopArea}' ))) ORDER BY  malkov_bus_routes.route_short_name`
    //const q =  `Select distinct routes.route_short_name From stops, trips, stop_times, routes Where stops.stop_id = stop_times.stop_id And stop_times.trip_id = trips.trip_id And trips.route_id = routes.route_id And stops.stop_name = ? And stops.stop_area = ? Order By routes.route_short_name`
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        else {
            return res.json(data)
        }
    })
}) 

app.post("/auto", (req, res) => {
    const Lat = req.body.Lat
    const Lon = req.body.Lon
    const q = `SELECT stop_name, stop_area, stop_lat, stop_lon, SQRT(POW(69.1 * (stop_lat - '${Lat}'), 2) + POW(69.1 * ('${Lon}' - stop_lon) * COS(stop_lat / 57.3), 2)) AS distance FROM malkov_bus_stops HAVING distance < 250 ORDER BY distance LIMIT 1`
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        else {
            return res.json(data)
        }
    })
}) 

/*app.post("/final", (req, res) => {
    const stopName = req.body.stopName
    const stopArea = req.body.stopArea
    const routeShortName = req.body.routeShortName
    const q = `SELECT malkov_bus_times.arrival_time, malkov_bus_trips.direction_code, malkov_bus_trips.trip_long_name FROM malkov_bus_stops, malkov_bus_trips, malkov_bus_times, malkov_bus_routes WHERE malkov_bus_stops.stop_id = malkov_bus_times.stop_id AND malkov_bus_times.trip_id = malkov_bus_trips.trip_id AND malkov_bus_trips.route_id = malkov_bus_routes.route_id AND malkov_bus_stops.stop_name = '${stopName}' AND malkov_bus_routes.route_short_name = '${routeShortName}' AND malkov_bus_stops.stop_area = '${stopArea}' AND malkov_bus_times.arrival_time GROUP BY malkov_bus_times.arrival_time;`
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        else {
            return res.json(data)
        }
    })
}) */




app.post('/final', (req, res) => {
    var nextStops = [];
    var limit = 5;

    const stopName = req.body.stopName
    const stopArea = req.body.stopArea
    const routeShortName = req.body.routeShortName

    const q1 = `select malkov_bus_times.arrival_time, malkov_bus_trips.direction_code, malkov_bus_trips.trip_long_name from malkov_bus_stops, malkov_bus_trips, malkov_bus_times, malkov_bus_routes where malkov_bus_stops.stop_id = malkov_bus_times.stop_id AND malkov_bus_times.trip_id = malkov_bus_trips.trip_id AND malkov_bus_trips.route_id = malkov_bus_routes.route_id AND malkov_bus_stops.stop_name = '${stopName}' AND malkov_bus_routes.route_short_name = '${routeShortName}' AND malkov_bus_stops.stop_area = '${stopArea}' AND malkov_bus_times.arrival_time > DATE_FORMAT(CONVERT((SELECT NOW()), TIME), '%H:%I') GROUP BY malkov_bus_times.arrival_time LIMIT ${limit}`
    
    
    db.query(q1, (err, result) => {
        if (err) throw err;
        else if (result.length < 5) {
            nextStops.push(result)
            nextStops.push({ "day": "next" })
            limit = limit - result.length
            const q2 = `select malkov_bus_times.arrival_time, malkov_bus_trips.direction_code, malkov_bus_trips.trip_long_name from malkov_bus_stops, malkov_bus_trips, malkov_bus_times, malkov_bus_routes where malkov_bus_stops.stop_id = malkov_bus_times.stop_id AND malkov_bus_times.trip_id = malkov_bus_trips.trip_id AND malkov_bus_trips.route_id = malkov_bus_routes.route_id AND malkov_bus_stops.stop_name = '${stopName}' AND malkov_bus_routes.route_short_name = '${routeShortName}' AND malkov_bus_stops.stop_area = '${stopArea}' AND malkov_bus_times.arrival_time > DATE_FORMAT(CONVERT('00:00', TIME), '%H:%I') GROUP BY malkov_bus_times.arrival_time LIMIT ${limit}`
            db.query(q2, (err, result) => {
                if (err) throw err;
                else
                    nextStops.push(result);
                    res.send(nextStops);
                    nextStops = [];
            })
        }
        else {
            nextStops.push(result);
            res.send(nextStops);
            nextStops = [];
        }
    })
})

app.listen(8800, () => {
    console.log("Connected to backend!!")
})