const mongoose = require("mongoose");

const dbConn = mongoose.connect("mongodb://127.0.0.1:27017/Discord", { serverSelectionTimeoutMS: 60000 })
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