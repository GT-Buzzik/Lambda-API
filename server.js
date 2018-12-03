const redirectUri = "https://buzzik-cooperpellaton.c9users.io:8080/process-token";
require('env2')('env.json');
const bodyParser = require('body-parser');
var passport = require('passport-cas2');
const casStrategy = require('passport-cas2').Strategy;
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const buzzik = require('./buzzik').buzzik(process.env['spotify_client_id'], process.env['spotify_client_secret'], redirectUri);
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())


let handleErr = (req, res) => err => {
    console.log(err);
    if (err.cookie) {
        res.cookie("token", err.cookie);
    }
    if (err.statusCode == 301) {
        return res.redirect(err.headers["Location"]);
    }
};

let handleData = (req, res) => data => {
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
};

/**
 * ROUTES!
 */

/**
 * POST
 */
app.post('/api/delete_user', (req, res) => {
    buzzik.deleteUser(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.post('/api/store_user_notification_frequency', (req, res) => {
    buzzik.storeNotificationFrequency(req.query.id, req.query.notification_frequency).then(handleData(req, res), handleErr(req, res));
});

app.post('/api/store_faculty_status', (req, res) => {
    buzzik.storeFacultyStatus(req.query.id, req.query.faculty_status).then(handleData(req, res), handleErr(req, res));
});

/**
 * GET
 */
app.get('/reset', (req, res) => {
    buzzik.defaultAction(null).then(handleData(req, res), handleErr(req, res));
});

app.get('/process-token', (req, res) => {
    let state = req.query.state;
    let code = req.query.code;
    buzzik.makeCookie(state, code).then(null, handleErr(req, res));
});

app.get('/', (req, res) => {
    buzzik.defaultAction((req.cookies || {})["token"], req.query.callback).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_listening_history', (req, res) => {
    if (req.query.id != null) {
        buzzik.fetchListeningHistory(req.query.id).then(handleData(req, res), handleErr(req, res));
    } else {
        res.statusMessage = "Invalid ID!";
        res.status(400).end();
        res.send();
    }
});

app.get('/api/get_user', (req, res) => {
    if (req.query.id != null) {
        buzzik.getUser(req.query.id).then(handleData(req, res), handleErr(req, res));
    } else {
        res.statusMessage = "Invalid ID!";
        res.status(400).end();
        res.send();
    }
});

app.get('/api/get_user_notification_frequency', (req, res) => {
    buzzik.getNotificationFrequency(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_faculty_status', (req, res) => {
    buzzik.getFacultyStatus(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_listening_history_multiple_users', (req, res) => {
    var tslow = 0;
    var tshigh = Number.MAX_SAFE_INTEGER;
    if (typeof req.body.timestamp_low !== 'undefined' && req.body.timestamp_low) {
        tslow = req.body.timestamp_low;
    }
    if (typeof req.body.timestamp_high !== 'undefined' && req.body.timestamp_high) {
        tshigh = req.body.timestamp_high;
    }
    buzzik.getListeningHistoryMultipleUsers(req.body.user_ids, tslow, tshigh).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_raw_data', (req, res) => {
    if (req.query.id != null) {
        buzzik.getRawData(req.query.id).then(handleData(req, res), handleErr(req, res));
    } else {
        res.statusMessage = "Invalid ID!";
        res.status(400).end();
        res.send();
    }
});

app.listen(process.env.PORT, () => console.log('Buzzik Spotify API handler listening on port:' + process.env.PORT))
