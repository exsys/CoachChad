const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

const HOURS_24_IN_MS = 86400000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("restorefaith")
        .setDescription("Try to restore the motivation of another user by giving them a point. Get 2 points if it works.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to give a point.")
            .setRequired(true)
        )
        .addStringOption(option => option.setName("habit")
            .setDescription("The habit you want the user to continue.")
            .setRequired(true)
            .addChoices(
                { name: "Meditation", value: "Meditation" },
                { name: "Walking", value: "Walking" },
                { name: "Healthy Sleep", value: "Healthy Sleep" },
                { name: "Healthy Meal", value: "Healthy Meal" },
                { name: "Track Nutritions", value: "Track Nutritions" },
                { name: "No Phone", value: "No Phone" },
                { name: "Drink Water", value: "Drink Water" },
                { name: "Sun Exposure", value: "Sun Exposure" },
                { name: "Stretching", value: "Stretching" },
                { name: "Journaling", value: "Journaling" },
                { name: "Cold shower", value: "Cold shower" },
            )
        ),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // TODO: protection timer after season unpause, or else everybody can restore faith

        let user;
        let target;
        let settings;
        try {
            settings = await Settings.findOne();
            user = await User.findOne({ discordId: interaction.user.id });            
            target = await User.findOne({ discordId: interaction.options.get("user").value });
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("That's nice of you but there is currently no season going on.");
            return;
        }

        if(settings.seasonPaused) {
            await interaction.editReply("The season is currently paused. Please wait for further announcements.");
            return;
        }

        if (!user) {
            await interaction.editReply("Only participants can do this. Please choose a habit first.");
            return;
        }

        if (user.banned) {
            await interaction.editReply("Sorry pal, but you are not allowed to use commands for this season.");
            return;
        }

        if (!target) {
            await interaction.editReply("User isn't participating yet.");
            return;
        }

        if (user.discordId === target.discordId) {
            await interaction.editReply("Look at this smart-ass over here. You think you can trick Coach Chad, huh? GET IMPROVING!");
            return;
        }

        if (user.totalPoints < 1) {
            await interaction.editReply("You don't have any points to give away.");
            return;
        }

        let hasHabit;
        target.habits.forEach(habit => {
            if (habit.name === interaction.options.get("habit").value) {
                hasHabit = habit;

                // if last time submitted was over 3 days ago && user did at least one submission
                if (habit.lastCheckinTime + HOURS_24_IN_MS * 3 < Date.now() && habit.nextSubmissionTime !== 0) {
                    if (!habit.restoredBy) {
                        habit.restoredBy = {
                            discordId: interaction.user.id,
                            username: interaction.user.username,
                            consecutiveCheckins: 0,
                        }
                        target.totalPoints++;
                        target.pointsReceivedFromOthers++;

                        user.pointsGivenAway++;
                        user.totalPoints--;
                    }
                }
            }
        });

        if (!hasHabit) {
            await interaction.editReply("User didn't start that habit yet.");
            return;
        }

        try {
            await target.save();
            await user.save();

            await interaction.channel.send(`<@${target.discordId}> just gave you a point to continue ${hasHabit.name}. Don't let his trust go to waste! You can do it!`);
            await interaction.editReply(`Successfully sent point to ${target.username}`);
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
        }
    }
}