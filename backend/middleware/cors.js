const cors = require("cors")

const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
}

module.exports = cors(corsOptions)
