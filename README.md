# One Time Message Server
Written to allow a front-end client to save name, email, and message to the server with a one-time use token by sending the name, email, and message to `/message`. The token can be sent to `/message/:token` (e.g. `/message/738adea7-7311-4c24-b77a-a7ecf0651570`) to retrieve the name, email, and message, unless the token has already been used to retreive said data, or is more than 24 hours old. Note that the message and name fields will be sanitized to avoid HTML injection, and may not exactly correspond with what was sent.

## Dependencies
To install the dependencies, run `npm install`. The dependencies are:
- **Node.js** - Basic server backend
- **Express** - Framework for Node.js
- **Express Validator** - Validation middleware for express based on validator.js
- **Jest** - Testing framework
- **SuperTest** - A high-level abstraction for testing HTTP

## Running
### Commands
- `npm run dev` - Runs the server, uses the `bushman-dev` database
- `npm run watch` - Same as above but in watch mode (will reload when code changes)
- `npm test` or `npm run test` - Tests the code, uses `bushman-test` database (note: the `bushman-test` database is deleted after each test case) 
### Notes
- Must have a MongoDB instance running on localhost at port 27017
- The server runs on port 3000, though that can be changed by setting the `PORT` environment variable