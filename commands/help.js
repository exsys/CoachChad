const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName("help").setDescription("Shows you da wae."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply();

        const msgEmbed1 = new EmbedBuilder()
            .setColor(0x424549)
            .setTitle(`Admin Commands`)
            .setDescription("**/addhabit <name> <description>**: Adds a habit to the database.\n**/removehabit**: Removes a habit from the database.\n**/startseason**: Starts the next season.\n**/finishseason**: Ends the current season and announces winners.\n**/pauseseason**: Pauses the current season.\n**/unpauseseason**: Unpauses the current season.\n**/resetuser <user>**: Resets the stats of a user.\n**/updateleaderboard**: Updates the Leaderboard.\n")
            .addFields({ name: "Regular Commands (Part 1/2)", value: "**/callout <user>**: Call out a user who's proof is sus. You can steal a point from them after 24 hours if they don't submit further proof.\n**/changetimezone**: Lets you change your preferred timezone.\n**/choosehabit**: Choose a habit you want to improve. Submit daily proof to receive points.\n**/leaderboard**: Get the current leaderboard. Leaderboard is updated once a week.\n**/restorefaith <user>**: Restore the motivation of another user by giving them a point. If they check-in 3 consecutive days after that you will receive 2 points.\n"})
            .setFooter({
                text: "The more virtual achievements you have, the less real life achievements you can get.", 
                iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg",
            });

        const msgEmbed2 = new EmbedBuilder()
            .setColor(0x424549)
            .addFields({ name: "Regular Commands Part (2/2)", value: "**/stats**: Shows you your stats.\n**/steal <user>**: Steal one or more points from another user who's proof is overdue.\n**/submitproof <image>**: Submit proof for a habit.\n**/teamup <user>**: Ask another user to team up with you. If they accept you both will receive 1 more point for your next check-in.\n**/timeleft**: Shows you how much time you have left to submit proof for your habits.\n**/unselecthabit**: Unselect a habit. Only possible to call this command if a season isn't going on right now.\n"})
            .setFooter({ 
                text: "You are in competition with the entire world. You cannot be lazy.",
                iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg",
            });

        try {
            await interaction.editReply({ embeds: [msgEmbed1, msgEmbed2] });
            return;
        } catch (error) {
            console.log("error 0021");
        }
    }
}