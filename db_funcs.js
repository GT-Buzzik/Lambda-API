"use strict";
const util = require("util");
const fetch = require("node-fetch");
var SpotifyWebApi = require('spotify-web-api-node');
require('env2')('env.json');
const AWS = require("aws-sdk"),
    uuid = require('uuid');

AWS.config.update({
    region: process.env['dynamo_db_region'],
    endpoint: process.env['dynamo_db_endpoint'],
    accessKeyId: process.env['dynamo_db_access_id'],
    secretAccessKey: process.env['dynamo_db_secret_key'],
});
const documentClient = new AWS.DynamoDB.DocumentClient();

const scopes = ["user-read-private", "user-read-email"];
const state = "NA";

/**
 * Takes user_id, calls callback(err, data) where the data is a list
 * of tracks the user has listened to and their dates.
 */
module.exports.getListeningHistory = (user_id, callback) => {
    var params = {
        ExpressionAttributeValues: {
            ":UID": user_id
        },
        KeyConditionExpression: "user_id = :UID",
        ProjectionExpression: "listening_date, track",
        // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
        TableName: "listening_history"
    };
    console.log("getListeningHistory params: ", params);
    console.log("getLIsteningHistory user-id: ", user_id);
    return Promise.resolve(documentClient.query(params, (err, data) => {
        if (err) {
            // console.log("Error: ", err);
            return callback(err, null);
        }
        else {
            // console.log("DB Returned Items: ", data);
            return callback(null, data.Items);
        }
    }));
};

/**
 * Takes user_id, full listening history json (as string) from Spotify
 */
module.exports.storeListeningHistory = (user_id, spotifyHistory, callback) => {
    const hist = spotifyHistory;
    let i;
    for (i in hist.items) {
        let t = hist.items[i];
        let params = {
            Item: {
                "user_id": user_id,
                "listening_date": new Date(t.played_at).getTime(),
                "track": JSON.stringify(t.track)
            },
            // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
            TableName: "listening_history"
        }
        console.log(params);
        documentClient.put(params, function(err, data) {
            if (err) {
                console.log("Store listening history error: ", err);
            }
            if (data) {
                console.log("Store listening history data: ", data);
            }
            // callback(err, data);
        });
    }
}
