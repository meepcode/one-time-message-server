const express = require("express");
const app = express();


const messageRouter = require("./routes/messageRouter");

app.use(express.json())
app.use("/message", messageRouter);

const PORT = process.env.PORT || 3000; // Feel free to change port by changing PORT env variable
app.listen(PORT, (error) => {
    if (error) { // For debugging purposes
        throw error;
    }
    console.log(`Server listening on port ${PORT}`)
});