const SpotifyWebApi = require('spotify-web-api-node');
const db_funcs = require("./db_funcs");
const scopes = ["user-read-private", "user-read-email", "user-read-recently-played"];

let redirect = (location, cookie) => ({
    statusCode: 301,
    headers: {
        "Location": location
    },
    cookie: cookie,
    body: null
});

exports.buzzik = function(clientId, clientSecret, redirectUri) {
    const spotifyApi = new SpotifyWebApi({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirectUri
    });

    return {
        /**
         * Default function called on initial request to endpoint. Will login the user,
         * fetch their spotify results, then call the DB library to store the result
         * as based on their user_id from Spotify.
         */
        doStuff: cookie => {
            if (!cookie) {
                return Promise.reject(redirect(spotifyApi.createAuthorizeURL(scopes, "NA")));
            }
            var token = JSON.parse(cookie);
            spotifyApi.setAccessToken(token.access_token);
            spotifyApi.setRefreshToken(token.refresh_token);

            spotifyApi.getMe().then(
                function(data) {
                    var user_id = data.body.uri;
                    console.log("USER ID: " + user_id);
                    spotifyApi.getMyRecentlyPlayedTracks().then(
                        function(data) {
                            db_funcs.storeListeningHistory(user_id, data.body);
                        });
                },
                function(err) {
                    console.error(err);

                });
        },
        /**
         * Takes a user ID through the endpoint and calls out to the DB library
         * to make the request and return the result.
         */
        fetchListeningHistory: (user_id) => {
            return db_funcs.getListeningHistory(user_id)
                .then(data => {
                    return JSON.stringify(data);
                });
        },

        makeCookie: (state, code) => {
            return spotifyApi.authorizationCodeGrant(code).then(data => {
                return Promise.reject(redirect("/", JSON.stringify({
                    expires_at: new Date() / 1000 + data.body['expires_in'],
                    access_token: data.body['access_token'],
                    refresh_token: data.body['refresh_token']
                })));
            });
        }
    };
};