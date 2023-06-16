const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder().setName("startseason").setDescription("Starts the next season."),
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
            settings.seasonOngoing = true;
            await settings.save();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        const msgEmbed = new EmbedBuilder()
            .setColor(0x424549)
            .setTitle("New Season has started!")
            .setDescription("Chad and Chadettes!\n\nThe time has come to get yo ass moving, it is time to become the best version of yourself!\n\nFor each daily check-in of a habit I will give you a point. Try to get as many points as possible by the end of the season. But be careful, if you forget to submit proof for a habit others will be able to steal your points! And once a habit is selected you can't unselect it until the end of the season. So get your protein shakes ready and start improving!\n\nGood luck and have fun!")
            .addFields({ name: "Notice", value: "If you want to change your timezone use the command /changetimezone." });

        try {
            await interaction.editReply("Season successfully started.");
            await interaction.channel.send("@everyone");
            await interaction.channel.send({ embeds: [msgEmbed] });
        } catch (error) {
            console.log("error 0022");
        }
    }
}