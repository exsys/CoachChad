const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
    leaderboard: {
        type: [{
            discordId: {
                type: String,
                required: true,
            },
            username: {
                type: String,
                required: true,
            },
            points: {
                type: Number,
                required: true,
            },
            place: {
                type: Number,
                required: true,
            }
        }],
        required: false,
    },
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema, "leaderboards");