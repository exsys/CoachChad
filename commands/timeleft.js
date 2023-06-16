const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require("../schemas/user");

const HOURS_24_IN_MS = 86400000;

module.exports = {
    data: new SlashCommandBuilder().setName("timeleft").setDescription("Tells you how much time you have left to submit proof for your habits."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let user;
        try {
            user = await User.findOne({ discordId: interaction.user.id });
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!user) {
            try {
                await interaction.editReply("User couldn't be found. Please choose a habit first.");
                return;
            } catch (error) {
                console.log(error);
                return;
            }
        }

        let usersHabits = "";
        for (const habit of user.habits) {
            const zeroAM = new Date(parseInt(habit.lastCheckinTime) + HOURS_24_IN_MS);
            zeroAM.setUTCHours(0, 0, 0, 0);
            const msTimestamp = (parseInt(habit.lastCheckinTime) + (zeroAM.getTime() - parseInt(habit.lastCheckinTime))) + HOURS_24_IN_MS; // hours till 0 am + 24 hours

            const msLeft = msTimestamp - parseInt(habit.lastCheckinTime);
            const hoursLeft = Math.floor(msLeft / 1000 / 60 / 60);
            const minutesOverflowLeft = Math.floor((msLeft / 1000 / 60) % 60);
            usersHabits += `**${habit.name}**: ${hoursLeft}h ${minutesOverflowLeft}min`;
        }

        const msgEmbed = new EmbedBuilder()
            .setColor(0x424549)
            .setTitle(`${user.username}'s stats`)
            .setDescription(`Time left until proof has to be submitted:\n\n${usersHabits}`)
            .setFooter({
                text: "If you can spend 8 hours a day building someone elses dreams, you can at least spend 1 hour building your own.",
                iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg"
            });

        try {
            await interaction.editReply({ embeds: [msgEmbed] });
        } catch (error) {
            console.log(error);
        }
    }
}