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
 * Do NOT expose attribute_name outside of this file.
 * Stores a single attribute to be associated with a user in user_data table.
 * @param {} user_id
 * @param {*} attribute_name
 * @param {*} attribute_value
 */
function storeUserValue(user_id, attribute_name, attribute_value) {
    let params = {
        ExpressionAttributeValues: {
            ":UID": user_id,
            ":ATTR": attribute_value
        },
        Key: {
            "user_id": user_id
        },
        TableName: "user_data",
        UpdateExpression: "SET " + attribute_name + " = :ATTR",
    };
    return new Promise((resolve, reject) => {
        documentClient.updateItem(params, function(err, data) {
            if (err) {
                reject(err);
            }
            if (data) {
                resolve(data);
            }
        });
    });
}

/**
 * retrieves the attributes attribute_names for the given user_id from the user_data table.
 * @param {} user_id
 * @param {*} attribute_names
 */
function getUserValues(user_id, attribute_names) {
    var params = {
        ExpressionAttributeValues: {
            ":UID": user_id
        },
        KeyConditionExpression: "user_id = :UID",
        ProjectionExpression: attribute_names,
        TableName: "user_data"
    };

    return new Promise((resolve, reject) => {
        documentClient.query(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}



/**
 * Takes user_id, calls callback(err, data) where the data is a list
 * of tracks the user has listened to and their dates.
 */
module.exports.getListeningHistory = (user_id) => {
    var params = {
        ExpressionAttributeValues: {
            ":UID": user_id
        },
        KeyConditionExpression: "user_id = :UID",
        ProjectionExpression: "listening_date, track_name, track_duration, track_explicit",
        // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
        TableName: "listening_history"
    };
    // console.log("getListeningHistory params: ", params);
    // console.log("getLIsteningHistory user-id: ", user_id);

    return new Promise((resolve, reject) => {
        documentClient.query(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    }).then(data => {
        // data.Items.forEach(item => {
        //     item.track = JSON.parse(item.track);
        // });
        return data;
    });

};

/**
 * Takes user_id, full listening history object from Spotify
 */
module.exports.storeListeningHistory = (user_id, spotifyHistory) => {
    const hist = spotifyHistory;
    let i;
    hist.items.forEach((t) => {
        let params = {
            Item: {
                "user_id": user_id,
                "listening_date": new Date(t.played_at).getTime(),
                "track_name": t.name,
                "track_duration": t.duration_ms / 1000,
                "track_explicit": t.explicit
            },
            TableName: "listening_history"
        };
        console.log(params);
        documentClient.put(params, function(err, data) {
            if (err) {
                console.log("store listening history error: ", err);
            }
            if (data) {
                console.log("store listening history data: ", data);
            }
        });
    });
}

/**
 * Store user info like GT info, spotify access token, spotify id
 */
module.exports.storeUserSpotifyDetails = (user_id, spotify_access_token, spotify_access_key) => {
    return storeUserValue(user_id, "spotify_access_token", spotify_access_token).then(() => {
        storeUserValue(user_id, "spotify_access_key", spotify_access_key);
    });
}

/**
 * Retrieve spotify access info
 */
module.exports.getUserSpotifyDetails = (user_id) => {
    return getUserValues(user_id, "spotify_access_token, spotify_access_key");
}

/**
 * Store user notification frequency, frequency is string "never", "weekly", or "monthly"
 */
module.exports.storeUserNotificationFrequency = (user_id, notification_frequency) => {
    return storeUserValue(user_id, "notification_frequency", notification_frequency);
}

/**
 * Retrieve user notification frequency.
 */
module.exports.getUserNotificationFrequency = (user_id) => {
    return getUserValues(user_id, "notification_frequency");
}

/**
 * Store user faculty status, boolean true or false
 */
module.exports.storeUserFacultyStatus = (user_id, is_faculty) => {
    return storeUserValue(user_id, "is_faculty", is_faculty);
}

/**
 * Retrieve user notification frequency.
 */
module.exports.getUserFacultyStatus = (user_id) => {
    return getUserValues(user_id, "is_faculty");
}


/**
 * Delete the account info and listening history of the specified user_id
 */
module.exports.deleteUserAccount = (user_id) => {
    // Need to delete account first so that we don't accidentally add
    // to listening history in between the operations.

    // Delete account from user_data
    let params = {
        RequestItems: {
            "user_data": [{
                DeleteRequest: {
                    Key: {
                        "user_id": {
                            S: user_id
                        }
                    }
                }
            }]
        }
    }

    return new Promise((resolve, reject) => {
        documentClient.batchWriteItem(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    }).then((data) => {
        // Delete listening history
        // TODO: make sure this is correct.

        // first retrieve listening history.
        let params = {
            ExpressionAttributeValues: {
                ":UID": user_id
            },
            KeyConditionExpression: "user_id = :UID",
            ProjectionExpression: "listening_date",
            // TableName : process.env.LISTENING_HISTORY_TABLE_NAME
            TableName: "listening_history"
        };


        // Make sure this is right!
        return new Promise((resolve, reject) => {
            documentClient.query(params, (err, data) => {
                if (err) {
                    //Clearly have a problem.
                    reject(err);
                } else {
                    // Delete all entries in data.
                    resolve(data);
                }
            });
        });

    }).then((data) => {
        for (let i = 0; i < data.Items.length; i += 25) {
            let delete_keys = data.Items.slice(i, i + 25);
            delete_keys.forEach((k) => {
                //Reformat each entry to be according to what we need for batchwriteitem
                k = {
                    DeleteRequest: {
                        Key: {
                            "user_id": {
                                S: user_id
                            },
                            "listening_date": {
                                N: k.listening_date
                            }
                        }
                    }
                }
            });

            let params = {
                RequestItems: {
                    "listening_history": delete_keys
                }
            }

            documentClient.batchWriteItem(params, (err, data) => {
                if (err) {
                    console.log("Batch write item error: ", err);
                } else {
                    console.log("User deleted! ", user_id);
                }
            });
        }
    });
}
