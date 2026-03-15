# One Time Message Server
Written to allow a front-end client to save name, email, and message to the server with a one-time use token by sending to /message. The token can be sent to /message/:token (e.g. /message/738adea7-7311-4c24-b77a-a7ecf0651570) to retrieve the name, email, and message, unless the token has already been used to retreive said data, or is more than 24 hours old. Saves data on localhost mongodb server.

## Dependencies
To install the dependencies, run `npm install`. The dependencies are:
- **Node.js** - Basic server backend
- **Express** - Framework for Node.js
- **Express Validator** - Validation middleware for express based on validator.js
- **Jest** - Testing framework
- **SuperTest** - A high-level abstraction for testing HTTP

## Running
You must have a mongodb instance running on localhost, port 27017. The server will be listening on port 3000, though you can change that via setting the PORT environment variable.
- `npm run dev` - Runs the server, uses the bushman-dev database
- `npm run watch` - Same as above but in watch mode (will reload when code changes)
- `npm test` or `npm run test` - Tests the code, uses bushman-test database (note: the bushman-test database is deleted after each test case) 