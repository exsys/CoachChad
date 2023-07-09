const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removepoints")
        .setDescription("Removes points from a selected user.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to remove points from.")
            .setRequired(true)
        )
        .addNumberOption(option => option.setName("points")
            .setDescription("The amount of points you want to remove from the user.")
            .setRequired(true)
        ),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // if user doesn't exist create
        const target = interaction.options.get("user");
        let user;
        try {
            user = await User.findOne({ discordId: target.value });
            if (!user) {
                const newUser = new User({
                    username: target.user.username,
                    discordId: target.value,
                });

                try {
                    user = await newUser.save();
                } catch (error) {
                    await interaction.editReply("Error: Couldn't save user. Please try again later.");
                    return;
                }
            }
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        // give points
        try {
            if (user.totalPoints - interaction.options.get("points").value < 0) {
                await interaction.editReply("User would have less than 0 points. Cancelled command.");
                return;
            }
            user.totalPoints -= interaction.options.get("points").value;
            await user.save();
            await interaction.editReply("Successfully given points.");
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
        }
    }
}