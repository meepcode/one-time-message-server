const postMessage = (req, res) => {
    res.send("POST received at /message")
}

const getMessage = (req, res) => {
    res.send(`GET received at /message, token: ${req.params.token}`)
}

module.exports = {
    postMessage,
    getMessage
}