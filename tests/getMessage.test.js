const express = require('express')
const app = express()

const request = require('supertest')
const { describe, expect, it, beforeEach, afterEach } = require('@jest/globals')
const { MongoClient } = require('mongodb')
const {
    checkNoErrors,
    checkThrowsErrors,
    database,
    tearDown,
} = require('./common')

const messageRouter = require('../routes/messageRouter')

app.use(express.json())
app.use('/message', messageRouter)

jest.useFakeTimers({ advanceTimers: true })

beforeEach(async () => {
    const client = new MongoClient(database)
    await client.connect()
    await client.db().collection('messages')
        .insertMany([
            {
                name: 'AJ B.',
                email: 'email@example.com',
                message: 'Hello, World!',
                token: '738adea7-7311-4c24-b77a-a7ecf0651570',
                creationtime: new Date(),
            },
            {
                name: 'John D.',
                email: 'otheremail@example.com',
                message: 'Hello, Other World!',
                token: 'b7a645ff-5112-4bfa-aa99-3cc818d70890',
                creationtime: new Date(),
            },
        ])
    await client.close()
})

afterEach(tearDown)

describe('GET /message/:token with valid token', () => {
    it('retrieves name, email, and message from server', async () => {
        const res = await request(app).get(
            '/message/738adea7-7311-4c24-b77a-a7ecf0651570'
        )

        checkNoErrors(res)

        const { name, email, message } = res.body

        expect(res.status).toEqual(200)
        expect(name).toEqual('AJ B.')
        expect(email).toEqual('email@example.com')
        expect(message).toEqual('Hello, World!')
    })

    it('retrieves name, email, message when called twice', async () => {
        const res = await request(app).get(
            '/message/738adea7-7311-4c24-b77a-a7ecf0651570'
        )

        expect(checkNoErrors(res))

        const { name, email, message } = res.body

        expect(res.status).toEqual(200)
        expect(name).toEqual('AJ B.')
        expect(email).toEqual('email@example.com')
        expect(message).toEqual('Hello, World!')

        const res2 = await request(app).get(
            '/message/b7a645ff-5112-4bfa-aa99-3cc818d70890'
        )

        checkNoErrors(res2)

        const { name: name2, email: email2, message: message2 } = res2.body

        expect(res2.status).toEqual(200)
        expect(name2).toEqual('John D.')
        expect(email2).toEqual('otheremail@example.com')
        expect(message2).toEqual('Hello, Other World!')
    })

    it('validly retrieves message after 23 hours from token creation', () => {
        setTimeout(
            async () => {
                const res = await request(app).get(
                    '/message/738adea7-7311-4c24-b77a-a7ecf0651570'
                )

                checkNoErrors(res)

                const { name, email, message } = res.body

                expect(res.status).toEqual(200)
                expect(name).toEqual('AJ B.')
                expect(email).toEqual('email@example.com')
                expect(message).toEqual('Hello, World!')
            },
            23 * 60 * 60 * 1000
        ).unref() // Wait 23 hours before calling
    })
})

describe('GET /message/:token with invalid parameters', () => {
    it('fails when token is not valid UUID', async () => {
        const res = await request(app).get(
            '/message/48a5be40-44dd-b979-ef430f997921'
        )

        expect(res.status).toEqual(400)
        checkThrowsErrors(res, ['Token in incorrect format (must be UUID)'])

        const { name, email, message } = res.body

        expect(name).toBeNull()
        expect(email).toBeNull()
        expect(message).toBeNull()
    })

    it('fails when token is not found', async () => {
        const res = await request(app).get(
            '/message/48a5be40-1f83-44dd-b979-ef430f997921'
        )

        expect(res.status).toEqual(400)
        checkThrowsErrors(res, ['Token not found in database'])

        const { name, email, message } = res.body

        expect(name).toBeNull()
        expect(email).toBeNull()
        expect(message).toBeNull()
    })

    it('fails when token has already been used', async () => {
        await request(app).get('/message/738adea7-7311-4c24-b77a-a7ecf0651570')
        const res = await request(app).get(
            '/message/738adea7-7311-4c24-b77a-a7ecf0651570'
        )

        expect(res.status).toEqual(400)
        checkThrowsErrors(res, ['Token already used'])

        const { name, email, message } = res.body

        expect(name).toBeNull()
        expect(email).toBeNull()
        expect(message).toBeNull()
    })

    it('fails when token expires after 24 hours', async () => {
        setTimeout(
            async () => {
                const res = await request(app).get(
                    '/message/738adea7-7311-4c24-b77a-a7ecf0651570'
                )

                expect(res.status).toEqual(400)
                checkThrowsErrors(res, ['Token expired after 24 hours'])

                const { name, email, message } = res.body

                expect(name).toBeNull()
                expect(email).toBeNull()
                expect(message).toBeNull()
            },
            24 * 60 * 60 * 1000
        ).unref() // Wait 24 hours before calling
    })
})
