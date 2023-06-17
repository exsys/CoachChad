require("dotenv").config();
const mongoose = require("mongoose");

const dbConn = mongoose.connect(process.env.DB_STRING, { serverSelectionTimeoutMS: 60000 })
    .then(m => m.connection.getClient())
    .catch(err => console.log(err));

mongoose.connection.on("connected", () => {
    console.log("MongoDB connected.");
});

mongoose.connection.on("error", (err) => {
    console.log(err);
});

process.on('SIGINT', () => {
    mongoose.connection.close()
        .then(() => {
            console.log("connection closed");
            process.exit(0);
        });
});

module.exports = dbConn;