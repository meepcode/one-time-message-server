const { MongoClient } = require('mongodb')

/**
 * Checks if there were no errors received by the server. Fails otherwise.
 * @param {*} res The response received from the server during testing
 */
exports.checkNoErrors = (res) => {
    // Verifies that there are no errors received from the server
    const { success, error } = res.body
    expect(success).toEqual(true);
    expect(error).toBeNull();
}

/**
 * Verifies that the expected errors, and no others, are received from the server. If any expected errors are not received, or there are unexpected errors, fail.
 * 
 * @param {*} res The response received from the server
 * @param {*} expectedErrors An array containing strings of any expected errors from the server
 */
exports.checkThrowsErrors = (res, expectedErrors) => {
    const { success, error: errorStr } = res.body
    expect(success).toEqual(false)

    const errors = errorStr.split('\n')
    for (const error of errors) {
        if (!expectedErrors.includes(error)) {
            throw new Error(`Unexpected error: ${error}`)
        }
    }

    expect(errors.length).toEqual(expectedErrors.length) // there shouldn't be any expected errors that weren't returned
}

// Database will generally be bushman-test
const database = `mongodb://localhost:27017/bushman-${process.env.NODE_ENV}`
exports.database = database

/**
 * Deletes the database used for the tests, usually bushman-test
 */
exports.tearDown = async () => {
    const client = new MongoClient(database)
    await client.connect()
    await client.db().dropDatabase()
    await client.close()
}
