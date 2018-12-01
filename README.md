# Buzzik Server Architecture

## Routes

All routes fall under `/api/`.

### POST

* `/api/delete_user?id=XXX`
Returns the status of the delete, either `200` or `404`. Query parameter requires a valid `id` to be passed.

* `/api/store_user_notification_frequency?id=XXX&notification_frequency=YYY`
Stores the `notification_frequency` specified against the `id` in the database. Notification frequency is either `day`, `week`, `month`, `never`.

* `/api/store_user_notification_frequency?id=XXX&faculty_status=YYY`
Stores the `faculty_status` of the `id`. Both query parameters must be valid. `faculty_status` must be boolean.

### GET
* `/api/get_user?id=XXX`
Returns information about the user queried. Query parameter requires a valid `id` to be passed.

* `/api/get_user_notification_frequency?id=XXX`
Return the notification frequency stored in the database for a given user. Query parameter requires a valid `id` to be passed.

* `/api/get_faculty_status?id=XXX`
Returns whether the given `id` belongs to a faculty member or not. Return value is boolean. Query parameter requires a valid `id` to be passed.

* `/get_listening_history?id=XXX`
This will return the user listening history of pre-registered user `XXX`.


# Release Notes

* APIs are now secured by the GT Login service.
* Repeated polling of Spotify listening data for each user so that their history can be periodically updated.
* Fixed issue with where Get Listening History was erroring out and not executing.
* Fixed CORS issue that broke compatibility with frontend.
* Ported to AWS Lambda frameworks

# Known Issues/Defects

* Faculty/Student status and other GT profile information is not automatically populated.
* Does not store cohorts

# Installation Guide
