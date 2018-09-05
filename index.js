"use strict";
const util = require("util");
const fetch = require("node-fetch");
var SpotifyWebApi = require('spotify-web-api-node');
const AWS = require("aws-sdk"),
  uuid = require('uuid'),
  documentClient = new AWS.DyunamoDB.DocumentClient();
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirectUri = "https://40swmg6fu2.execute-api.us-east-1.amazonaws.com/default/process-token";
const spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirectUri
});

const scopes = ["user-read-private", "user-read-email"];
const state = "NA";

let redirect = location => ({
  statusCode: 301,
  headers: { "Location": location },
  body: null
});

let getAccessToken = callback => {
  return callback(null, redirect(spotifyApi.createAuthorizeURL(scopes, state)));
};

let doSomethingWithSpotify = (code, state, callback) => {
  spotifyApi.setAccessToken(code);
  spotifyApi.getMyRecentlyPlayedTracks().then(function(data) {
    const dbData = {
      user_id: client_id,
      listening_date: new Date().getTime(),
      data: JSON.stringify(data.body)
    };
    documentClient.put(dbData, (err, data) => {
      (err) ? console.error("Error: ", err) : console.log("Success! Added: ", JSON.stringify(data));
    });
    return callback(null, { statusCode: 200, body: data.body });
  }, function(err) {
    console.error(err);
  });
};

exports.handler = (event, context, callback) => {
  try {
    if (event.resource == "/access-token") {
      return getAccessToken(callback);
    }
    else if (event.resource == "/process-token") {
      return doSomethingWithSpotify(event.queryStringParameters.code, event.queryStringParameters.state, callback);
    }
    else {
      callback(new Error("no action for " + event.resource));
    }
  }
  catch (error) {
    callback(error);
  }
};
