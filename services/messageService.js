const { MongoClient } = require("mongodb");

let database = `mongodb://localhost:27017/bushman-${process.env.NODE_ENV}`

exports.createToken = async (name, email, message) => {
    let token = crypto.randomUUID();

    const client = new MongoClient(database);

    try {
        await client.connect();
        const db = client.db();
        await db.collection("messages").insertOne({
            name: name,
            email: email,
            message: message,
            token: token,
            creationTime: new Date()
        })

    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }

    return token;
}