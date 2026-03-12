const express = require("express");
const app = express();

const request = require("supertest");
const { describe, expect, it, beforeEach, afterEach } = require("@jest/globals")
const { MongoClient } = require("mongodb")

const messageRouter = require("../routes/messageRouter");

app.use(express.json());
app.use("/message", messageRouter);

const checkNoErrors = (res) => { // Verifies that there are no errors received from the server
    const { success, error } = res.body;
    if (!success || error) { // Even if success is true, but there's an error message, something went wrong and vice-versa
        let result = "Unexpected error received from server:\n"
        result += `success = ${success}\n`;
        result += error ? error : "\"\""
        throw new Error(result)
    }
}

const checkThrowsErrors = (res, expectedErrors) => {
    const { success, error: errorStr } = res.body;
    const errors = errorStr.split('\n');

    expect(success).toEqual(false);

    for (const error of errors) {
        if (!expectedErrors.includes(error)) {
            throw new Error(`Unexpected error: ${error}`);
        }
    }
    
    expect(errors.length).toEqual(expectedErrors.length);
}

describe('POST /message with valid parameters', () => {

    afterEach(async () => {
        const client = new MongoClient("mongodb://localhost:27017/bushman-test");
        await client.connect();
        await client.db().dropDatabase();
        await client.close();
    })

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