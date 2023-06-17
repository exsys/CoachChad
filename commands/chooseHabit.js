const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const User = require("../schemas/user");
const Habit = require("../schemas/habit");
const Settings = require("../schemas/settings");

// after calling this command the user will be able to select a habit through a dropdown menu
module.exports = {
    data: new SlashCommandBuilder().setName("choosehabit").setDescription("Choose a Habit to start."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply();
        
        let allHabits;
        let settings;
        try {
            allHabits = await Habit.find().lean();
            settings = await Settings.findOne().lean();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if(settings.seasonPaused) {
            await interaction.editReply("The season is currently paused. Please wait for further announcements.");
            return;
        }

        if (!allHabits.length) {
            await interaction.editReply("Error: No habits exist currently.");
            return;
        }

        let selectHabits = [];
        for (const habit of allHabits) {
            selectHabits.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(habit.name)
                    .setDescription(habit.description)
                    .setValue(habit.name),
            )
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId("habit")
            .setPlaceholder("Choose a habit.")
            .addOptions(selectHabits);

        const row = new ActionRowBuilder().addComponents(select);

        let response;
        try {
            response = await interaction.editReply({
                content: "Choose a habit you want to improve!",
                components: [row]
            });
        } catch (error) {
            console.log(error);
            await interaction.editReply("Error: Something went wrong. Please try again later.");
            return;
        }

        // if user doesn't exist yet create an database entry first
        let user;
        try {
            user = await User.findOne({ discordId: interaction.user.id });
            if (!user) {
                const newUser = new User({
                    username: interaction.user.username,
                    discordId: interaction.user.id,
                });

                try {
                    user = await newUser.save();
                } catch (error) {
                    await interaction.editReply("Error: Couldn't save user. Please try again later.");
                    return;
                }
            }
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
            return;
        }

        // ensures that only the user who triggered the original interaction can use the buttons.
        const collectorFilter = i => i.user.id === interaction.user.id;

        // collects selections of user. multiple selections are possible
        try {
            const collector = await response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000,
                filter: collectorFilter,
            });

            collector.on("collect", async confirmation => {
                if (confirmation.customId === "habit") {
                    // cancel if user tries to select a habit twice
                    const habitAlreadySelected = user.habits.find(habit => habit.name === confirmation.values[0]);
                    if (habitAlreadySelected) {
                        await confirmation.update({ content: "Habit already selected." });
                        return;
                    }

                    // add habit to user
                    const habit = allHabits.find(habit => habit.name === confirmation.values[0]);
                    const now = Date.now();
                    const userHabit = {
                        habitId: habit.habitId,
                        name: habit.name,
                        description: habit.description,
                        pointsWorth: habit.pointsWorth,
                        lastCheckinTime: now,
                        nextSubmissionTime: now,
                    }
                    user.habits.push(userHabit);

                    try {
                        await user.save();
                        await confirmation.update({ content: `${habit.name} was successfully saved.` });
                    } catch (error) {
                        await interaction.editReply("Error: Couldn't save habit. Please try again later.");
                    }
                }
            });
        } catch (e) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    }
}