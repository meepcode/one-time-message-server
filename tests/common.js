const { MongoClient } = require("mongodb")

exports.checkNoErrors = (res) => { // Verifies that there are no errors received from the server
    const { success, error } = res.body;
    if (!success || error) { // Even if success is true, but there's an error message, something went wrong and vice-versa
        let result = "Unexpected error received from server:\n"
        result += `success = ${success}\n`;
        result += error ? error : "\"\""
        throw new Error(result)
    }
}

exports.checkThrowsErrors = (res, expectedErrors) => {
    const { success, error: errorStr } = res.body;
    expect(success).toEqual(false);

    const errors = errorStr.split('\n');
    for (const error of errors) {
        if (!expectedErrors.includes(error)) {
            throw new Error(`Unexpected error: ${error}`);
        }
    }
    
    expect(errors.length).toEqual(expectedErrors.length);
}

const database = `mongodb://localhost:27017/bushman-${process.env.NODE_ENV}`
exports.database = database

exports.tearDown = async () => {
    const client = new MongoClient(database);
    await client.connect();
    await client.db().dropDatabase();
    await client.close();
}
