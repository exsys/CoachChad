const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");
const Leaderboard = require("../schemas/leaderboard");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder().setName("updateleaderboard").setDescription("Updates the current leaderboard."),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let settings;
        let allUsers;
        let leaderboard;
        try {
            settings = await Settings.findOne();
            allUsers = await User.find().sort("-totalPoints").limit(10).lean();
            leaderboard = await Leaderboard.findOne(); // TODO: get specific id if there's ever different kind of leaderboards
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings || !leaderboard) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }
        leaderboard.leaderboard = [];

        let placement = 1;
        allUsers.forEach(user => {
            const leaderboardUser = {
                discordId: user.discordId,
                username: user.username,
                points: user.totalPoints,
                place: placement,
            };
            leaderboard.leaderboard.push(leaderboardUser);
            placement++;
        });

        try {
            await leaderboard.save();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        try {
            await interaction.editReply("Leaderboard successfully updated.");
        } catch (error) {
            console.log("error 0024");
        }
    }
}