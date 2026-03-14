const { validationResult, matchedData, check, param } = require("express-validator");
const messageService = require("../services/messageService");

const returnError = (res, errors, payload) => {
    let error = ""

    for (let i = 0; i < errors.length; i++) {
        if (i > 0) {
            error += "\n";
        }
        error += errors[i];
    }

    payload.success = false;
    payload.error = error;

    return res.status(400).json(payload);
}

const postMessageValidator = [
    check("name").trim()
        .exists({ values: 'falsy' }).withMessage("Name required for leaving a message")
        .escape(),
    check("email").trim()
        .exists({ values: 'falsy' }).withMessage("Email address required for leaving a message").bail()
        .isEmail().withMessage("Email address must be valid"),
    check("message")
        .exists({ values: 'falsy' }).withMessage("Message field required").bail()
        .isLength({ max: 250 }).withMessage("Message must be at most 250 characters")
        .escape()
]

exports.postMessage = [
    postMessageValidator,
    async (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return returnError(res, errors.array().map((error) => error.msg), { token: null })
        }

        const { name, email, message } = matchedData(req);

        const token = await messageService.createToken(name, email, message);

        return res.status(200).json({
            success: true,
            error: null,
            token: token
        })
    }
];

const getMessageValidator = [
    param("token")
        .isUUID().withMessage("Token in incorrect format (must be UUID)")
]

exports.getMessage = [
    getMessageValidator,
    async (req, res) => {
        let errors = validationResult(req);
        let payload = { success: true, error: null, name: null, email: null, message: null }
        if (!errors.isEmpty()) {
            return returnError(res, errors.array().map((error) => error.msg), payload);
        }

        const { token } = matchedData(req);

        const result = await messageService.retrieveData(token);

        if (result.error) {
            return returnError(res, [result.error], payload)
        }

        return res.status(200).json({
            success: true,
            error: null,
            name: result.name,
            email: result.email,
            message: result.message
        })
    }
]