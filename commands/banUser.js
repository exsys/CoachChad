const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banuser")
        .setDescription("Bans a user for the current season. They won't be able to use commands anymore.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to ban.")
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
            await interaction.editReply("The user doesn't exist in the database yet. Did he even do something wrong?");
            return;
        }

        try {
            user.banned = true;
            await user.save();

            await interaction.editReply("Successfully banned user. They won't be able to use commands for this season anymore.");
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database.");
            return;
        }
    }
}