const { MongoClient } = require("mongodb");

let database = `mongodb://localhost:27017/bushman-${process.env.NODE_ENV}`

exports.createToken = async (name, email, message) => {
    let token = crypto.randomUUID();

    const client = new MongoClient(database);

    await client.connect();
    const db = client.db();
    await db.collection("messages").insertOne({
        name: name,
        email: email,
        message: message,
        token: token,
        creationTime: new Date()
    })

    client.close();

    return token;
}

exports.retrieveData = async (token) => {
    let client = new MongoClient(database);
    await client.connect();

    const document = await client.db().collection("messages").findOne({ token: token });

    let error;
    if (!document) {
        error = "Token not found in database"
    } else if (document.used) {
        error = "Token already used"
    } else if (Date.now() - document.creationTime > 24 * 60 * 60 * 1000) {
        error = "Token expired after 24 hours"
    }

    if (error) {
        await client.close();
        return { error }
    }

    await client.db().collection("messages").updateOne(document, { $set: { used: true }})
    
    await client.close()

    let { name, email, message } = document;

    return { name, email, message };
}