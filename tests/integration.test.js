const { tearDown, checkNoErrors, checkThrowsErrors } = require("./common");
const { describe, expect, it, afterEach } = require("@jest/globals")
const request = require("supertest");

const messageRouter = require("../routes/messageRouter");

const express = require("express");
const app = express();
app.use(express.json());
app.use("/message", messageRouter);

afterEach(tearDown);

jest.useFakeTimers({ advanceTimers: true });

describe("POST /message then GET /message/:token", () => {
    it("retrieves the request", async () => {
        const postRes = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "Hello, World!",
            });

        checkNoErrors(postRes);

        let token = postRes.body.token;

        const getRes = await request(app)
            .get("/message/" + token);
        
        checkNoErrors(getRes);

        const { name, email, message } = getRes.body;

        expect(getRes.status).toEqual(200)
        expect(name).toEqual("AJ B.");
        expect(email).toEqual("email@example.com");
        expect(message).toEqual("Hello, World!");
    })

    it("fails after waiting 24 hours", async () => {
        const postRes = await request(app)
            .post("/message")
            .type("json")
            .send({
                name: "AJ B.",
                email: "email@example.com",
                message: "Hello, World!",
            });

        checkNoErrors(postRes);

        let token = postRes.body.token;

        setTimeout(async () => {
            const res = await request(app)
                .get("/message/" + token); 
            
            expect(res.status).toEqual(400)
            checkThrowsErrors(res, ["Token expired after 24 hours"]);

            const { name, email, message } = res.body;

            expect(name).toBeNull();
            expect(email).toBeNull();
            expect(message).toBeNull();

        }, 24 * 60 * 60 * 1000).unref(); // Wait 24 hours before calling
    })
    it("succeeds when making 25 POST and 25 GET requests to save and retrieve data", async () => {
        let tokens = Array(25);

        for (let i = 0; i < 25; i++) {
            const res = await request(app)
                .post("/message")
                .type("json")
                .send({
                    name: "" + i,
                    email: i + "@example.com",
                    message: "Message Number: " + i,
                });

            checkNoErrors(res);

            tokens[i] = res.body.token;
        }

        for (let i = 0; i < 25; i++) {
            const getRes = await request(app)
                .get("/message/" + tokens[i]);
            
            checkNoErrors(getRes);

            const { name, email, message } = getRes.body;

            expect(getRes.status).toEqual(200)
            expect(name).toEqual("" + i);
            expect(email).toEqual(i + "@example.com");
            expect(message).toEqual("Message Number: " + i);
        }
    })
});