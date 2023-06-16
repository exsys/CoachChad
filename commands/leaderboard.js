const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Leaderboard = require("../schemas/leaderboard");

// leaderboard will be updated every 24h
module.exports = {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("Prints the current leaderboard."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply();

        let currLeaderboard;
        try {
            currLeaderboard = await Leaderboard.findOne();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
            return;
        }

        if (!currLeaderboard) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!currLeaderboard.leaderboard.length) {
            await interaction.editReply("Error: No users in leaderboard yet.");
            return;
        }

        let leaderboard = "";
        for (let i = 0; i < currLeaderboard.leaderboard.length; i++) {
            const boardUser = currLeaderboard.leaderboard[i];
            if (i === 0) {
                leaderboard += `**1st place**: <@${boardUser.discordId}>, Points: ${boardUser.points}\n`;
            } else if (i === 1) {
                leaderboard += `**2nd place**: <@${boardUser.discordId}>, Points: ${boardUser.points}\n`;
            } else if (i === 2) {
                leaderboard += `**3rd place**: <@${boardUser.discordId}>, Points: ${boardUser.points}\n`;
            } else {
                leaderboard += `**${i + 1}th place**: <@${boardUser.discordId}>, Points: ${boardUser.points}\n`;
            }
        }

        const msgEmbed = new EmbedBuilder()
            .setColor(0x67B7D1)
            .setTitle("Current Leaderboard")
            .setDescription(leaderboard)
            .addFields({ name: "\n", value: "\n" })
            .setFooter({
                text: "Losers are focused on winners but winners are focused on winning.",
                iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg"
            });

        try {
            await interaction.editReply({ embeds: [msgEmbed] });
        } catch (error) {
            console.log(error);
        }
    }
}