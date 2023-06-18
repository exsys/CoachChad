const mongoose = require("mongoose");

const callOutSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    habit: {
        type: String,
        required: true,
    },
    timestampCalledOut: {
        type: String,
        required: true,
    },
    timestampOfProof: {
        type: String,
        required: true,
    },
});

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
        required: true,
        default: 1,
    },
    checkins: {
        type: Number,
        default: 0,
    },
    lastCheckinTime: {
        type: String,
        required: false,
    },
    nextSubmissionTime: {
        type: String,
        required: false,
    },
    lastTimeStolen: {
        type: String,
        default: 0,
    },
    restoredBy: {
        type: {
            discordId: {
                type: String,
                required: true,
            },
            username: {
                type: String,
                required: true,
            },
            timestamp: {
                type: String,
                required: true,
            },
            consecutiveCheckins: {
                type: Number,
                required: true,
            }
        },
        required: false,
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    discordId: {
        type: String,
        required: true,
    },
    banned: {
        type: Boolean,
        default: false,
    },
    totalPoints: {
        type: Number,
        default: 0,
    },
    pointsStolen: {
        type: Number,
        default: 0,
    },
    pointsLost: {
        type: Number,
        default: 0,
    },
    pointsGivenAway: {
        type: Number,
        default: 0,
    },
    pointsReceivedFromOthers: {
        type: Number,
        default: 0,
    },
    partner: {
        type: {
            discordId: {
                type: String,
                required: true,
            },
            username: {
                type: String,
                required: true,
            }
        },
        required: false,
    },
    timezone: {
        type: Number,
        default: 0,
    },
    calledOut: {
        type: [callOutSchema],
        required: false,
    },
    habits: {
        type: [habitSchema],
        required: false,
    }
});

module.exports = mongoose.model("User", userSchema, "users");