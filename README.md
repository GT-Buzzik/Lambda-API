# Buzzik Server Architecture
## Table of Contents
* [Routes](#routes)
    + [POST](#post)
    + [GET](#get)
* [Release Notes](#release-notes)
* [Known Issues/Defects](#known-issuesdefects)
* [Installation Guide](#installation-guide)

## Routes

All routes fall under `/api/`, except for our login `/auth/login`.

### POST

* `/api/delete_user?id=XXX`
Returns the status of the delete, either `200` or `404`. Query parameter requires a valid `id` to be passed.

* `/api/store_user_notification_frequency?id=XXX&notification_frequency=YYY`
Stores the `notification_frequency` specified against the `id` in the database. Notification frequency is either `day`, `week`, `month`, `never`.

* `/api/store_faculty_status?id=XXX&faculty_status=YYY`
Stores the `faculty_status` of the `id`. Both query parameters must be valid. `faculty_status` must be boolean.

### GET

* `/api/get_user?id=XXX`
Returns information about the user queried. Query parameter requires a valid `id` to be passed.

* `/api/get_user_notification_frequency?id=XXX`
Return the notification frequency stored in the database for a given user. Query parameter requires a valid `id` to be passed.

* `/api/get_faculty_status?id=XXX`
Returns whether the given `id` belongs to a faculty member or not. Return value is boolean. Query parameter requires a valid `id` to be passed.

* `/api/get_raw_data?id=XXX`
Returns raw data of the queried `id` from the database.

* `/get_listening_history?id=XXX`
This will return the user listening history of pre-registered user `XXX`.


## Release Notes (v1.0.0)

* APIs are now secured by the GT Login service.
* Repeated polling of Spotify listening data for each user so that their history can be periodically updated.
* Fixed issue with where Get Listening History was erroring out and not executing.
* Fixed CORS issue that broke compatibility with frontend.
* Ported to AWS Lambda frameworks

## Known Issues/Defects

* Faculty/Student status and other GT profile information is not automatically populated.
* Does not store cohorts


## Installation Guide
- *Prerequisites:* To build and run the Buzzik Server architecture (without AWS Lambda) a minimum of 256Mb or RAM and 2GB of storage space are required. Additionally, [Node.js](https://nodejs.org/en/) of minimum version `6.11.2` must be installed.
- *Depedencies:* This project follows the standard convention of packing Node dependencies in [package.json](package.json). The following must be installed by running `npm install` in the root of the directory containing [package.json](package.json). The dependent npm packages are:
    - [aws-sdk](https://www.npmjs.com/package/aws-sdk): `v2.182.0`,
    - [body-parser](https://www.npmjs.com/package/body-parser): `v1.18.3`,
    - [cors](https://www.npmjs.com/package/cors): `v2.8.5`,
    - [node-fetch](https://www.npmjs.com/package/node-fetch): `v2.1.2`,
    - [passport-cas2](https://www.npmjs.com/package/passport-cas2): `v0.0.10`,
    - [spotify-web-api-node](https://www.npmjs.com/package/spotify-web-api-node): `v3.0.0`,
    - [util](https://www.npmjs.com/package/util): `v0.10.3`
- *Download Instructions:* Please download the latest released version of our source [here](https://github.com/GT-Buzzik/Lambda-API/releases).
- *Build Instructions:* Our releases are provided in `.tar.gz` tarballs. Please download the latest release, and open the tarball. If you have the necessary prerequisites you will be able to build by running `npm install` in the root directory containing the [package.json](package.json).
- *Installation:* To run the application locally no further installation is required. However, if you intend to install and run this from AWS, you'll need the following:
    - One Lambda instance.
    - One Route53 IP.
    - An API Gateway entry pointing at a Lambda entry for every API route you'd like to serve.
    - DynamoDB instance.
Setting this up will be highly non-trivial. Begin by uploading the .tar.gz you've downloaded from our release. From there you'll need to generate a redirectURI such as `some.url.goes.here/process-token` and make a Lambda route for this. You'll then have to point an API Gateway entry there. In addition, for every API endpoint such as `get_listening_history` or `get_user` that you'd like to serve you'll need to make a new entry in API Gateway pointing to the canonical Lambda instance. In addition, you'll need to setup the 3 DynamoDB tables, as shown in our `[db_funcs.js](db_funcs.js)`. 
- *Run:* To run this application locally simply execute `node server.js` in your local terminal after following the Build Instructions. If you've done so, you'll now be serving this on `localhost:8080`. If on AWS, invoke your API in anyway that you see fit (test, via URI, etc.).
- *Troubleshooting:* This release has no known errors. The only edge case to check: do not pass null inputs to any databse functions. These will result in `ValidationExceptions`, but if you've made it this far then you already know that!
