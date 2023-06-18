const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

const HOURS_24_IN_MS = 86400000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("submitproof")
        .setDescription("Submit your proof.")
        .addAttachmentOption(option => option.setName("proof")
            .setDescription("Submit an image or screenshot as proof that you completed your selected habit for the day.")
            .setRequired(true)),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply();

        let user;
        let settings;
        try {
            user = await User.findOne({ discordId: interaction.user.id });
            settings = await Settings.findOne();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!user) {
            await interaction.editReply("User not found. Please choose a habit first.");
            return;
        }

        if (user.banned) {
            await interaction.editReply("Sorry pal, but you are not allowed to use commands for this season.");
            return;
        }

        if (!user.habits) {
            await interaction.editReply("Please select a habit first.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("I commend your enthusiasm but the season hasn't started yet. Please wait with your check-ins until the season has started.");
            return;
        }

        if (settings.seasonPaused) {
            await interaction.editReply("Season is currently paused. Please wait for further announcements.");
            return;
        }

        let usersHabits = [];
        for (const habit of user.habits) {
            usersHabits.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(habit.name)
                    .setDescription(habit.description)
                    .setValue(habit.name)
            );
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId("proof")
            .setPlaceholder("Select the habit you want to submit proof for.")
            .addOptions(usersHabits);

        const row = new ActionRowBuilder().addComponents(select);
        let response;
        try {
            response = await interaction.editReply({
                content: "Select the habit you want to submit proof for.",
                components: [row]
            });
        } catch (error) {
            console.log(error);
            await interaction.editReply("Error: Something went wrong. Please try again later.");
            return;
        }

        // ensures that only the user who triggered the original interaction can use the buttons.
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({
                time: 60000,
                filter: collectorFilter,
            });

            let lastCheckinTimeTemp;
            if (confirmation.customId === "proof") {
                let provingHabit = user.habits.find(habit => habit.name === confirmation.values[0]);
                const currentTime = Date.now();
                lastCheckinTimeTemp = provingHabit.lastCheckinTime;
                provingHabit.lastCheckinTime = currentTime;

                // only give points to user if it's their first submission for the day
                if (currentTime >= provingHabit.nextSubmissionTime || provingHabit.nextSubmissionTime === 0) {
                    // convert users local time to a UTC timestamp
                    // TODO: if there's an error even once with timezone try just adding the timezone to currentTime
                    const usersTimezoneInMs = user.timezone * 60 * 60 * 1000;
                    const usersCurrTime = new Date(currentTime + usersTimezoneInMs);
                    usersCurrTime.setUTCHours(0, 0, 0, 0);
                    const nextSubmissionTime = usersCurrTime.getTime() + HOURS_24_IN_MS - usersTimezoneInMs; // hours => ms

                    provingHabit.nextSubmissionTime = nextSubmissionTime;
                    provingHabit.checkins++;
                    // if user has a partner give them 2 points and delete partner. (users have to get a partner every day)
                    if (user.partner) {
                        user.totalPoints += 2;
                        user.partner = undefined;
                    } else {
                        user.totalPoints++;
                    }

                    // if faith was restored by another user
                    if (provingHabit.restoredBy) {
                        const lastCheckinDay = lastCheckinTimeTemp;
                        const currCheckinDay = currentTime;
                        const diffDays = Math.floor((currCheckinDay - lastCheckinDay) / HOURS_24_IN_MS);
                        // only if day difference is one day it's a consecutive check-in. include < 1 for month changes
                        // it's not possible to get in this block twice on the same day, so no need to check for 0
                        if (diffDays === 1 || provingHabit.restoredBy.consecutiveCheckins === 0) {
                            provingHabit.restoredBy.consecutiveCheckins++;
                        } else if (diffDays >= 2) {
                            // remove restoredBy if user failed to do consecutive check-ins
                            provingHabit.restoredBy = undefined;
                        }

                        // if user checked in 3 consecutive times after being restored, give user who restored faith 2 points
                        if (provingHabit.restoredBy.consecutiveCheckins >= 3) {
                            try {
                                const restoringUser = await User.findOne({ discordId: provingHabit.restoredBy.discordId });
                                if (!restoringUser) {
                                    console.log("Bruh how in da hell is this possible?");
                                }

                                restoringUser.totalPoints += 2;

                                try {
                                    await restoringUser.save();
                                    await interaction.channel.send(`<@${restoringUser.discordId}> you received 2 points for successfully restoring the motivation of ${user.username}!`);

                                    provingHabit.restoredBy = undefined;
                                } catch (error) {
                                    console.log("error 0018");
                                }
                            } catch (error) {
                                console.log("error 0017");
                            }
                        }
                    }
                }

                // tell user if submission was successful
                try {
                    await user.save();
                    await confirmation.update({ content: "Successfully submitted proof." });

                } catch (error) {
                    await confirmation.update({ content: "Submitting proof failed." });
                    return;
                }

                // post the submission in the channel
                try {
                    //const image = new AttachmentBuilder(interaction.options.get("proof").attachment.url, { name: "submission.png" });
                    //await interaction.channel.send({ files: [image] });
                    const msgEmbed = new EmbedBuilder()
                        .setColor(0x67B7D1)
                        .setTitle(`${user.username} submitted a proof for ${confirmation.values[0]}`)
                        .setImage(interaction.options.get("proof").attachment.url)
                        .setFooter({ text: "Don't forget to stay hydrated!", iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg" });

                    await interaction.channel.send({ embeds: [msgEmbed] });
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    }
}