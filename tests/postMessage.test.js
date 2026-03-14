const express = require("express");
const app = express();

const request = require("supertest");
const { describe, expect, it, beforeEach, afterEach } = require("@jest/globals")
const { MongoClient } = require("mongodb")

const messageRouter = require("../routes/messageRouter");
const { checkNoErrors, checkThrowsErrors, database, tearDown } = require("./common");

app.use(express.json());
app.use("/message", messageRouter);

describe('POST /message with valid parameters', () => {

    afterEach(tearDown)

    it("returns a randomly generated token", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "Hello World!",
            });

        expect(checkNoErrors(res));
        expect(res.body.token).toMatch(/^([0-9a-f]){8}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){12}$/)
        expect(res.status).toEqual(200)
    })
    it("can be repeated without error", async () => {
        const res1 = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "Hello World!",
            });

        expect(checkNoErrors(res1));
        expect(res1.body.token).toMatch(/^([0-9a-f]){8}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){12}$/)
        expect(res1.status).toEqual(200)
        
        const res2 = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "John D.",
                email: "otheremail@example.com",
                message: "Hello World!",
            });

        expect(checkNoErrors(res2));
        expect(res2.body.token).toMatch(/^([0-9a-f]){8}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){12}$/)
        expect(res2.status).toEqual(200)
        expect(res2.body.token).not.toEqual(res1.body.token) // Tokens should be different
    });
    it("works with message of length 250", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "a".repeat(250),
            });

        expect(checkNoErrors(res));
        expect(res.body.token).toMatch(/^([0-9a-f]){8}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){4}-([0-9a-f]){12}$/)
        expect(res.status).toEqual(200)

    });

    it("saves the name, message, and email to the server", async () => {
        await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "Hello, World!"
            })
        
        const client = new MongoClient(database);
        try {
            await client.connect();

            const { name, email, message } = await client.db().collection("messages").findOne();

            expect(name).toEqual("AJ B.");
            expect(email).toEqual("email@example.com");
            expect(message).toEqual("Hello, World!");
        } catch (error) {
            await client.close();
            throw error;
        }

        await client.close();
    })

    it("sanitizes input", async () => {
        await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "<b>AJ B.</b>&nbsp;",
                email: "email@example.com",
                message: "<script>console.log(\"You have been hacked!\");</script>\\"
            })
        
        const client = new MongoClient(database);
        try {
            await client.connect();

            const { name, email, message } = await client.db().collection("messages").findOne();

            expect(name).toEqual("&lt;b&gt;AJ B.&lt;&#x2F;b&gt;&amp;nbsp;");
            expect(email).toEqual("email@example.com");
            expect(message).toEqual("&lt;script&gt;console.log(&quot;You have been hacked!&quot;);&lt;&#x2F;script&gt;&#x5C;");
        } catch (error) {
            await client.close();
            throw error;
        }

        await client.close();
    })
})

describe('POST /message with invalid parameters', () => {
    it("fails when missing name", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                email: "email@example.com",
                message: "Hello World!",
            });

        expect(checkThrowsErrors(res, ["Name required for leaving a message"]))
    })
    it("fails when missing email", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                message: "Hello World!",
            });

        expect(checkThrowsErrors(res, ["Email address required for leaving a message"]))
    })
    it("fails when missing message", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com"
            });

        expect(checkThrowsErrors(res, ["Message field required"]))
    })
    it("fails when invalid email", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email at example dot com",
                message: "Hello World!",
            });

        expect(checkThrowsErrors(res, ["Email address must be valid"]))
    })
    it("fails when message too long", async () => {
        const res = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "a".repeat(251),
            });

        expect(checkThrowsErrors(res, ["Message must be at most 250 characters"]))
    })
})