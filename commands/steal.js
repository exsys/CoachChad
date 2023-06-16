const { SlashCommandBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

const HOURS_24_IN_MS = 86400000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("steal")
        .setDescription("Steal points from another user who didn't submit proof for their habit.")
        .addUserOption(option => option.setName("user")
            .setDescription("The user you want to steal points from.")
            .setRequired(true)
        ),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // TODO: implement a check if season was paused. so users can't instantly steal points after season is unpaused
        // probably do something like a protection timer

        let robber;
        let target;
        let settings;
        try {
            settings = await Settings.findOne();
            robber = await User.findOne({ discordId: interaction.user.id });
            target = await User.findOne({ discordId: interaction.options.get("user").value });
        } catch (error) {
            try {
                await interaction.editReply("Error: couldn't connect to database. Please try again later.");
                return;
            } catch (error) {
                console.log("0010");
                return;
            }
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("Stealing is bad! Unless it's during a season. So please wait until a season starts.");
            return;
        }

        if(settings.seasonPaused) {
            await interaction.editReply("The season is currently paused. Please wait for further announcements.");
            return;
        }

        if (robber.discordId === target.discordId) {
            await interaction.editReply("Well... kinda weird to steal from yourself, but you do you man.");
        }

        if (target.totalPoints < 1) {
            try {
                await interaction.editReply("User has no points left.");
            } catch (error) {
                console.log("error 0020");
            }
            return;
        }

        // can only steal if proof is due
        let amountStolen = 0;
        for (const habit of target.habits) {
            if (habit.lastTimeStolen === 0) {
                if (habit.nextSubmissionTime + HOURS_24_IN_MS < Date.now()) {
                    amountStolen++;
                    robber.pointsStolen++;
                    robber.totalPoints++;
                    target.pointsLost++;
                    target.totalPoints--;
                    habit.lastTimeStolen = Date.now();
                }
            } else {
                if (habit.lastTimeStolen + HOURS_24_IN_MS < Date.now()) {
                    amountStolen++;
                    robber.pointsStolen++;
                    robber.totalPoints++;
                    target.pointsLost++;
                    target.totalPoints--;
                    habit.lastTimeStolen = Date.now();
                }
            }
        }

        // if robber has called out at least one person check if he's eligible to steal target's points anyways
        if (robber.calledOut.length && amountStolen === 0) {
            // iterate through all called out habits
            robber.calledOut.forEach(calledOutHabit => {
                // only steal if robber called out target and 24 hours passed
                if (calledOutHabit.user === target.discordId && calledOutHabit.timestampCalledOut + HOURS_24_IN_MS < Date.now()) {
                    // iterate through all habits of target, to check which one to deduct points from
                    target.habits.forEach(habit => {
                        if (habit.name === calledOutHabit.habit) {
                            // only continue if target didn't submit another proof
                            if (calledOutHabit.timestampOfProof === habit.lastCheckinTime) {
                                robber.pointsStolen++;
                                robber.totalPoints++;
                                target.pointsLost++;
                                target.totalPoints--;
                                amountStolen++;
                                habit.lastTimeStolen = Date.now();
                            }

                            // remove calledOut object from robber
                            robber.calledOut = robber.calledOut.filter(
                                calledOutObj => (calledOutObj.habit !== habit.name && calledOutObj.user !== target.discordId)
                            );
                        }
                    });
                }
            });
        }

        // only save users if at least 1 point was stolen
        if (amountStolen >= 1) {
            try {
                await robber.save();
                await target.save();

                await interaction.editReply(`Successfully stolen ${amountStolen} points.`);
            } catch (error) {
                await interaction.editReply("Error: couldn't connect to database. Please try again later.");
            }
        } else {
            try {
                await interaction.editReply("No points to steal.");
            } catch (error) {
                console.log("error 0011");
            }
        }
    }
}