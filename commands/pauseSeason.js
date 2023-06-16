const { SlashCommandBuilder } = require('discord.js');
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder().setName("pauseseason").setDescription("Pauses the current season."),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let settings;
        try {
            settings = await Settings.findOne();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        try {
            settings.seasonPaused = true;
            await settings.save();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
        }

        try {
            await interaction.editReply("Successfully paused the season.");
        } catch (error) {
            console.log("error 0025");
        }
    }
}