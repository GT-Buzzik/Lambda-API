const redirectUri = "https://buzzik-cooperpellaton.c9users.io:8080/process-token";
require('env2')('env.json');
const bodyParser = require('body-parser');
var passport = require('passport');
const casStrategy = require('passport-cas2').Strategy;
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const awsServerlessExpress = require('aws-serverless-express');
const db_funcs = require("./db_funcs");
const buzzik = require('./buzzik').buzzik(process.env['spotify_client_id'], process.env['spotify_client_secret'], redirectUri);
const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new casStrategy({
        casURL: 'https://login.gatech.edu/cas'
    },
    function(username, profile, done) {
        done(null, { username, profile });
    }));



function authenticationMiddleware() {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/login')
    }
}

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
app.get('/auth/login', passport.authenticate('cas', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});


/**
 * POST
 */
app.post('/api/delete_user', authenticationMiddleware(), (req, res) => {
    // req.user.profile
    buzzik.deleteUser(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.post('/api/store_user_notification_frequency', authenticationMiddleware(), (req, res) => {
    buzzik.storeNotificationFrequency(req.query.id, req.query.notification_frequency).then(handleData(req, res), handleErr(req, res));
});

app.post('/api/store_faculty_status', authenticationMiddleware(), (req, res) => {
    buzzik.storeFacultyStatus(req.query.id, req.query.faculty_status).then(handleData(req, res), handleErr(req, res));
});

/**
 * GET
 */
app.get('/reset', authenticationMiddleware(), (req, res) => {
    buzzik.defaultAction(null).then(handleData(req, res), handleErr(req, res));
});

app.get('/process-token', authenticationMiddleware(), (req, res) => {
    let state = req.query.state;
    let code = req.query.code;
    buzzik.makeCookie(state, code).then(null, handleErr(req, res));
});

app.get('/', authenticationMiddleware(), (req, res) => {
    buzzik.defaultAction((req.cookies || {})["token"]).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_user', authenticationMiddleware(), (req, res) => {
    buzzik.getUser(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_user_notification_frequency', authenticationMiddleware(), (req, res) => {
    buzzik.getNotificationFrequency(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_faculty_status', authenticationMiddleware(), (req, res) => {
    buzzik.getFacultyStatus(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.get('/api/get_listening_history_multiple_users', authenticationMiddleware(), (req, res) => {
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

app.get('/api/get_raw_data', authenticationMiddleware(), (req, res) => {
    buzzik.getRawData(req.query.id).then(handleData(req, res), handleErr(req, res));
});

app.listen(process.env.PORT, () => console.log('Buzzik Spotify API handler listening on port:' + process.env.PORT))
