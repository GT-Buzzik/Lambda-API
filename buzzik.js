const SpotifyWebApi = require('spotify-web-api-node');
const db_funcs = require("./db_funcs");
const scopes = ["user-read-private", "user-read-email", "user-read-recently-played"];

let redirect = (location, cookie) => ({
    statusCode: 301,
    headers: { "Location": location },
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

            return spotifyApi.getMyRecentlyPlayedTracks();
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
