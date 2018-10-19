// Env. Specific.
const redirectUri = "https://buzzik-cooperpellaton.c9users.io:8080/process-token";

require('env2')('env.json');
const express = require('express');
const cookieParser = require('cookie-parser');
const db_funcs = require("./db_funcs");
const buzzik = require('./buzzik').buzzik(process.env['spotify_client_id'], process.env['spotify_client_secret'], redirectUri);
const app = express();
app.use(cookieParser());

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
    res.send(data);
};

/**
 * ROUTES!
 */

app.get('/reset', (req, res) => {
    buzzik.doStuff(null).then(handleData(req, res), handleErr(req, res));
});

app.get('/process-token', (req, res) => {
    let state = req.query.state;
    let code = req.query.code;
    buzzik.makeCookie(state, code).then(null, handleErr(req, res));
});

app.get('/', (req, res) => {
    buzzik.defaultAction((req.cookies || {})["token"]).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_spotify_details', (req, res) => {
    buzzik.fetch_spotify_details(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/fetch_listening_history', (req, res) => {
    buzzik.fetchListeningHistory(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/delete_user', (req, res) => {
    buzzik.deleteUser(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_user', (req, res) => {
    buzzik.getUser(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_user_notification_frequency', (req, res) => {
    buzzik.getNotificationFrequency(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/store_user_notification_frequency', (req, res) => {
    buzzik.storeNotificationFrequency(req.query.id, req.query.notification_frequency).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_faculty_status', (req, res) => {
    buzzil.getFacultyStatus(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.listen(process.env.PORT, () => console.log('Buzzik Spotify API handler listening on port:' + process.env.PORT))
