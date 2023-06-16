const { SlashCommandBuilder } = require('discord.js');
const Settings = require("../schemas/settings");
const Leaderboard = require("../schemas/leaderboard");
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder().setName("setup").setDescription("Initializes and sets up Coach Chad."),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            await Settings.deleteMany({});
            const settings = new Settings({
                currentSeason: 0,
                seasonOngoing: false,
                seasonPaused: false,
            });

            await Leaderboard.deleteMany({});
            const leaderboard = new Leaderboard({});

            await User.deleteMany({});

            await settings.save();
            await leaderboard.save();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        try {
            await interaction.editReply("Successfully setup Coach Chad. He is ready to whoop asses!");
        } catch (error) {
            console.log("error 0025");
        }
    }
}