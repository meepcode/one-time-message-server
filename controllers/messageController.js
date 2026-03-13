const { validationResult, matchedData, check, param } = require("express-validator");
const messageService = require("../services/messageService");

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
            let errorsArr = errors.array();
            let error = ""

            for (let i = 0; i < errorsArr.length; i++) {
                if (i > 0) {
                    error += "\n";
                }
                error += errorsArr[i].msg;
            }

            return res.status(400).json({
                success: false,
                error: error,
                token: null
            })
        } 

        const { name, email, message } = matchedData(req);

        const token = await messageService.createToken(name, email, message);

        res.status(200).json({
            success: true,
            error: null,
            token: token
        })
    }
];

const returnGetMessageError = (res, errorsArr) => {
        let error = ""

        for (let i = 0; i < errorsArr.length; i++) {
            if (i > 0) {
                error += "\n";
            }
            error += errorsArr[i];
        }

        return res.status(400).json({
            success: false,
            error: error,
            name: null,
            email: null,
            message: null,
        })
}

const getMessageValidator = [
    param("token")
        .isUUID().withMessage("Token in incorrect format (must be UUID)")
]

exports.getMessage = [
    getMessageValidator,
    async (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return returnGetMessageError(res, errors.array().map((error) => error.msg));
        }

        const { token } = matchedData(req);

        const result = await messageService.retrieveData(token);

        if (result.error) {
            return returnGetMessageError(res, [result.error])
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