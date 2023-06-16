const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetuser")
        .setDescription("Resets all points and habits of a user.")
        .addUserOption(option => option.setName("user")
            .setDescription("User to reset.")
            .setRequired(true)
        ),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            let delUser = await User.findOne({ discordId: interaction.options.get("user").value });
            if (!delUser) {
                try {
                    await interaction.editReply("Error: User doesn't exist in database yet.");
                    return;
                } catch (error) {
                    console.log("error 0005");
                    return;
                }
            }
            
            delUser.totalPoints = 0;
            delUser.pointsLost = 0;
            delUser.pointsStolen = 0;
            delUser.habits = undefined;
            delUser.calledOut = undefined;
            delUser.partner = undefined;

            try {
                await delUser.save();
                await interaction.editReply("Successfully reset user.");
            } catch (error) {
                await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
                return;
            }
        } catch (error) {
            try {
                await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
                return;
            } catch (error) {
                console.log("error 0006");
            }
        }
    }
}