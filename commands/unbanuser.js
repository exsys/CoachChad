const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unbanuser")
        .setDescription("Unbans a banned user.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to unban.")
            .setRequired(true)
        ),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let user;
        let settings;
        try {
            settings = await Settings.findOne();
            user = await User.findOne({ discordId: interaction.options.get("user").value });
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("There is no season going on right now.");
            return;
        }

        if (!user) {
            await interaction.editReply("The user doesn't exist in the database yet. Are you sure you banned them?");
            return;
        }

        if (!user.banned) {
            await interaction.editReply("The user isn't currently banned...");
            return;
        }

        try {
            user.banned = false;
            await user.save();

            await interaction.editReply("Successfully unbanned user. They are now able to use commands again.");
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database.");
            return;
        }
    }
}