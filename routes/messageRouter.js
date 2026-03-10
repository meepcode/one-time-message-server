const { Router } = require("express");
const messageRouter = Router();

const messageController = require("../controllers/messageController")

messageRouter.route("/")
    .post(messageController.postMessage)

messageRouter.route("/:token")
    .get(messageController.getMessage)

module.exports = messageRouter;