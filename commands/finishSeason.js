const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Leaderboard = require("../schemas/leaderboard");
const Settings = require("../schemas/settings");
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder().setName("finishseason").setDescription("Finishes the current season and announces the winners."),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let settings;
        let leaderboard;
        try {
            settings = await Settings.findOne();
            leaderboard = await Leaderboard.findOne(); // TODO: get specific id if more leaderboards are ever introduced
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!leaderboard) {
            await interaction.editReply("Error: Leaderboard doesn't exist yet. Please create one by calling /updateleaderboard");
            return;
        }

        const msgEmbed = new EmbedBuilder()
            .setColor(0x424549)
            .setTitle("Season ended!")
            .setDescription("Chad and Chadettes!\n\nThe season has officially ended!\n\nI hope your asses are severely whooped. All of you who made it till the end, I am proud of you! You are on your best way to become the best version of yourself!")
            .setFooter({ 
                text: "If you are not hard on yourself, nobody will.",
                iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg",
            });

        let leaderboardMsg = "";
        let counter = 1;
        leaderboard.leaderboard.forEach(user => {
            switch (user.place) {
                case 1:
                    leaderboardMsg += `**1st place**: <@${user.discordId}> with ${user.points} points\n`;
                    break;
                case 2:
                    leaderboardMsg += `**2nd place**: <@${user.discordId}> with ${user.points} points\n`;
                    break;
                case 3:
                    leaderboardMsg += `**3rd place**: <@${user.discordId}> with ${user.points} points\n`;
                    break;
                default:
                    leaderboardMsg += `**${counter}th place**: <@${user.discordId}> with ${user.points} points\n`;
                    break;
            }
            counter++;
        });
        const winnersEmbed = new EmbedBuilder()
            .setColor(0x424549)
            .setTitle("Winner winner protein dinner!")
            .setDescription(`This is the list of the top 10 users.\n\nCongratulations to the winners, you will become proper Chads/Chadettes one day!\n\n${leaderboardMsg}`)

        try {
            settings.currentSeason++;
            settings.seasonOngoing = false;
            await settings.save();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        try {
            await User.deleteMany({});
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }
        
        try {
            await interaction.editReply("Season successfully finished.");
            await interaction.channel.send("@everyone");
            await interaction.channel.send({ embeds: [msgEmbed, winnersEmbed] });
        } catch (error) {
            console.log("error 0023");
        }
    }
}