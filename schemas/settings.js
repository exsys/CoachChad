const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    currentSeason: {
        type: Number,
        required: true,
    },
    seasonOngoing: {
        type: Boolean,
        required: true,
    },
    seasonPaused: {
        type: Boolean,
        required: true,
    },
});

module.exports = mongoose.model("Setting", settingsSchema, "settings");