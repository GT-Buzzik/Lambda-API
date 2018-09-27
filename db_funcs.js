"use strict";
const util = require("util");
const fetch = require("node-fetch");
var SpotifyWebApi = require('spotify-web-api-node');
require('env2')('env.json');
const AWS = require("aws-sdk"),
    uuid = require('uuid');

AWS.config.update({
    region: process.env.DynamoDBRegion,
    endpoint: process.env.DynamoDBEndpoint,
    accessKeyId: process.env.DynamoDBAccessKeyId,
    secretAccessKey: process.env.DynamoDBSecretAccessKey,
});
const documentClient = new AWS.DynamoDB.DocumentClient();

// const client_id = process.env.client_id;
// const client_secret = process.env.client_secret;
// const redirectUri = "https://40swmg6fu2.execute-api.us-east-1.amazonaws.com/default/process-token";
// // const redirectUri = "http://localhost:8080";
// const spotifyApi = new SpotifyWebApi({
//   clientId: client_id,
//   clientSecret: client_secret,
//   redirectUri: redirectUri
// });

const scopes = ["user-read-private", "user-read-email"];
const state = "NA";

exports.db_funcs = () => {
    return {
        /**
         * Takes user_id, calls callback(err, data) where the data is a list
         * of tracks the user has listened to and their dates.
         */
        getListeningHistory : (user_id, callback) => {
            var params = {
                ExpressionAttributeNames: {
                    "#UID" : user_id
                },
                FilterExpression: "user_id = #UID",
                ProjectionExpression: "listening_date, track",
                // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
                TableName : "listening_history"
            };
            documentClient.scan(params, (err, data) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, data.items);
                }
            });
        },

        /**
         * Takes user_id, full listening history json (as string) from Spotify
         */
        storeListeningHistory : (user_id, spotifyHistory, callback) => {
            const hist = JSON.parse(spotifyHistory);
            for (let t in hist.items) {
                let params = {
                    Item : {
                        "user_id": user_id,
                        "listening_date" : new Date(t.played_at).getTime(),
                        "track": JSON.stringify(t.track)
                    },
                    // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
                    TableName : "listening_history"
                }
                documentClient.put(params, function(err, data){
                    callback(err, data);
                });
            }
        }
    }
}
