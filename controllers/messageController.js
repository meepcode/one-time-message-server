const {
    validationResult,
    matchedData,
    check,
    param,
} = require('express-validator')
const messageService = require('../services/messageService')

/**
 * Returns an error string to the server with the payload, concatenating the various errors in the error array.
 * 
 * @param {*} res The response variable to send with
 * @param {*} errors An array of errors, even if only one
 * @param {*} payload The JSON data which will be sent in the case of errors, as well as an error string and a success boolean
 * @returns Sent request
 */
const returnError = (res, errors, payload) => {
    let error = errors.join('\n')

    payload.success = false
    payload.error = error

    return res.status(400).json(payload)
}

const postMessageValidator = [
    check('name').trim()
        .exists({ values: 'falsy' }).withMessage('Name required for leaving a message')
        .isString().withMessage('Name must be a string')
        .escape(),
    check('email').trim()
        .exists({ values: 'falsy' }).withMessage('Email address required for leaving a message').bail()
        .isEmail().withMessage('Email address must be valid'),
    check('message')
        .exists({ values: 'falsy' }).withMessage('Message field required').bail()
        .isLength({ max: 250 }).withMessage('Message must be at most 250 characters')
        .escape(),
]

/**
 * Handles POST requests to /message, including validation, generating the token and saving data to the database 
 * 
 * Returns an error to the client if: one of the three required parameters is not included, the name is not a string, the email is not a valid email address, or the message is greater than 250 characters.
 */
exports.postMessage = [
    postMessageValidator,
    async (req, res) => {
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            return returnError(
                res,
                errors.array().map((error) => error.msg),
                { token: null }
            )
        }

        const { name, email, message } = matchedData(req)

        const token = await messageService.createToken(name, email, message)

        return res.status(200).json({
            success: true,
            error: null,
            token: token,
        })
    },
]

/**
 * Validator for getMessage
 */
const getMessageValidator = [
    param('token')
        .isUUID().withMessage('Token in incorrect format (must be UUID)'),
]

/**
 * Handles the request for getting a message given a token, including validation of the token retrieving data from the server, and returning it to the callee.
 * 
 * Returns an error to the client if the token is not a UUID, or if messageService returns one
 */
exports.getMessage = [
    getMessageValidator,
    async (req, res) => {
        let errors = validationResult(req)
        let payload = {
            success: true,
            error: null,
            name: null,
            email: null,
            message: null,
        }
        if (!errors.isEmpty()) {
            return returnError(
                res,
                errors.array().map((error) => error.msg),
                payload
            )
        }

        const { token } = matchedData(req)

        const result = await messageService.retrieveData(token)

        if (result.error) {
            return returnError(res, [result.error], payload)
        }

        return res.status(200).json({
            success: true,
            error: null,
            name: result.name,
            email: result.email,
            message: result.message,
        })
    },
]
