const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder().setName("stats").setDescription("Tells you your current stats."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const user = await User.findOne({ discordId: interaction.user.id });
            if (!user) {
                try {
                    await interaction.editReply("Couldn't find user in database. Please choose a habit and try again.");
                    return;
                } catch (error) {
                    console.log("error 0008");
                    return;
                }
            }

            // format user's habits for the embed
            let usersHabits = "";
            let counter = 0;
            for (const habit of user.habits) {
                if (counter === 0) {
                    usersHabits += habit.name;
                } else {
                    usersHabits += ", " + habit.name;
                }
                counter++;
            }

            let partnerLine = "";
            if (user.partner) {
                partnerLine = `**Partner: ${user.partner.username}**`;
            } else {
                partnerLine = "**Partner: **";
            }

            const msgEmbed = new EmbedBuilder()
                .setColor(0x424549)
                .setTitle(`${user.username}'s stats`)
                .setDescription(`${partnerLine}\n**Current Points**: ${user.totalPoints}\n**Points stolen from others**: ${user.pointsStolen}\n**Points lost**: ${user.pointsLost}\n**Current habits**: ${usersHabits}\n`)
                //.setDescription(`**Your timezone**: GMT ${(user.timezone < 0) ? user.timezone : `+${user.timezone}`}\n${partnerLine}\n**Current Points**: ${user.totalPoints}\n**Points stolen from others**: ${user.pointsStolen}\n**Points lost**: ${user.pointsLost}\n**Current habits**: ${usersHabits}\n`)
                .setFooter({ text: "Opportunities don't happen, you create them.", iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg" });

            await interaction.editReply({ embeds: [msgEmbed] });
            return;
        } catch (error) {
            try {
                await interaction.editReply("Something went wrong. Please try again later.");
            } catch (error) {
                console.log("error 0009");
            }
        }
    }
}