const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
    habitId: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    pointsWorth: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("Habit", habitSchema, "habits");