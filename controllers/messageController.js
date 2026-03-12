const { validationResult, matchedData, check } = require("express-validator");
const messageService = require("../services/messageService");

const postMessageValidator = [
    check("name").trim()
        .exists({ values: 'falsy' }).withMessage("Name required for leaving a message"),
    check("email").trim()
        .exists({ values: 'falsy' }).withMessage("Email address required for leaving a message").bail()
        .isEmail().withMessage("Email address must be valid"),
    check("message")
        .exists({ values: 'falsy' }).withMessage("Message field required").bail()
        .isLength({ max: 250 }).withMessage("Message must be at most 250 characters")
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

exports.getMessage = (req, res) => {
    res.send(`GET received at /message, token: ${req.params.token}`)
}