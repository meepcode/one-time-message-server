const { MongoClient } = require("mongodb");

let database = process.env.NODE_ENV == "test" ? "mongodb://localhost:27017/bushman-test" : "mongodb://localhost:27017/bushman-db"

exports.createToken = async (name, email, message) => {
    let token = crypto.randomUUID();

    const client = new MongoClient(database);

    try {
        await client.connect();
        const db = client.db("bushman-test");
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