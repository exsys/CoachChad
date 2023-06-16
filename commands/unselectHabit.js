const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder().setName("unselecthabit").setDescription("Unselect a habit that was selected."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply();

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

        if (settings.seasonOngoing) {
            await interaction.editReply("You can't unselect your habits while a season is ongoing. Please wait until the season has ended.");
            return;
        }
        
        let user;
        try {
            user = await User.findOne({ discordId: interaction.user.id });
            if (!user) {
                await interaction.editReply("User not in database yet. Please choose a habit first.");
                return;
            }
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
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
            .setCustomId("unselect")
            .setPlaceholder("Unselect a habit.")
            .addOptions(usersHabits);

        const row = new ActionRowBuilder().addComponents(select);
        let response;
        try {
            response = await interaction.editReply({
                content: "Unselect a habit.",
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
            const collector = await response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000,
                filter: collectorFilter,
            });

            collector.on("collect", async confirmation => {
                if (confirmation.customId === "unselect") {
                    user.habits = user.habits.filter(habit => habit.name !== confirmation.values[0]);
                    try {
                        await user.save();
                        await confirmation.update({ content: `${confirmation.values[0]} was successfully unselected.` });
                    } catch (error) {
                        console.log(error);
                        await confirmation.update({ content: "Error: Couldn't unselect habit. Please try again later." });
                    }
                }
            });
        } catch (error) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    }
}