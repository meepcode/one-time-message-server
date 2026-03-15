const { MongoClient } = require('mongodb')

let database = `mongodb://localhost:27017/bushman-${process.env.NODE_ENV}`

/**
 * Creates a token to save with the name, email, and message to the database
 * 
 * @param {*} name 
 * @param {*} email 
 * @param {*} message 
 * @returns The created token
 */
exports.createToken = async (name, email, message) => {
    let token = crypto.randomUUID()

    const client = new MongoClient(database)

    await client.connect()
    const db = client.db()
    await db.collection('messages').insertOne({
        name: name,
        email: email,
        message: message,
        token: token,
        creationTime: new Date(), // To check later if the token has expired
    })

    client.close()

    return token
}

/**
 * Retrieves the data corresponding to the particular token.
 * 
 * Returns error if: The token is not in the database, the token has already been used in the past, or the token has expired (24 hours after creation)
 * @param {*} token The token to search for in the database
 * @returns An error if there's an error, otherwise it returns the name, email, and message corresponding to the token
 */
exports.retrieveData = async (token) => {
    let client = new MongoClient(database)
    await client.connect()

    const document = await client.db()
        .collection('messages')
        .findOne({ token: token })

    let error
    if (!document) {
        error = 'Token not found in database'
    } else if (document.used) {
        error = 'Token already used'
    } else if (Date.now() - document.creationTime > 24 * 60 * 60 * 1000) {
        error = 'Token expired after 24 hours'
    }

    if (error) {
        await client.close()
        return { error }
    }

    await client.db()
        .collection('messages')
        .updateOne(document, { $set: { used: true } })

    await client.close()

    let { name, email, message } = document

    return { name, email, message }
}
