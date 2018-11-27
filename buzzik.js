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
        defaultAction: cookie => {
            if (!cookie) {
                return Promise.reject(redirect(spotifyApi.createAuthorizeURL(scopes, "NA")));
            }
            var token = JSON.parse(cookie);
            spotifyApi.setAccessToken(token.access_token);
            spotifyApi.setRefreshToken(token.refresh_token);

            spotifyApi.getMe().then(
                function(data) {
                    var user_id = data.body.uri;
                    spotifyApi.getMyRecentlyPlayedTracks().then(
                        function(data) {
                            db_funcs.storeListeningHistory(user_id, data.body, spotifyApi);
                        });

                    return JSON.stringify("200");

                },
                function(err) {
                    console.error(err);
                });
            return new Promise((resolve, reject) => {
                resolve("200");
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

        /**
         * Takes a user ID through the delete_user endpoint and calls the
         * DB library to delete said user, then return the result of that
         * delete operation.
         */
        deleteUser: (user_id) => {
            return db_funcs.deleteUserAccount(user_id).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Takes a user_id and then calls the DB Func to get the user's spotify
         * details.
         */
        getUser: (user_id) => {
            return db_funcs.getUserSpotifyDetails(user_id).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Takes a user_id and returns the notification frequency associated with
         * their ID in the database.
         */
        getNotificationFrequency: (user_id) => {
            return db_funcs.getUserNotificationFrequency(user_id).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Requires a user_id and notification_frequency. Stores this association
         * in the database so that it can be pulled from the app.
         */
        storeNotificationFrequency: (user_id, notification_frequency) => {
            return db_funcs.storeUserNotificationFrequency(user_id, notification_frequency).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Sets the faculty status of a given user.
         */
        storeFacultyStatus: (user_id, faculty_status) => {
            return db_funcs.storeUserFacultyStatus(user_id, faculty_status).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Requires a user_id. Returns whether a given user_id is a faculty.
         */
        getFacultyStatus: (user_id) => {
            return db_funcs.getUserFacultyStatus(user_id).then(data => {
                return JSON.stringify(data);
            });
        },

        /**
         * Requires a list of user_ids, low and high timestamps.
         * Returns the data associated with them.
         */
        getListeningHistoryMultipleUsers: (user_ids, tslow, tshigh) => {
            return db_funcs.getListeningHistoryMultipleUsers(user_ids, tslow, tshigh).then(data => {
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
