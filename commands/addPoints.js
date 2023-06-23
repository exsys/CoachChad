const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addpoints")
        .setDescription("Give points to a selected user.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to give points.")
            .setRequired(true)
        )
        .addNumberOption(option => option.setName("points")
            .setDescription("The amount of points you want to give the user.")
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
            user.totalPoints += interaction.options.get("points").value;
            user.pointsReceivedFromOthers += interaction.options.get("points").value;
            await user.save();
            await interaction.editReply("Successfully given points.");
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
        }
    }
}