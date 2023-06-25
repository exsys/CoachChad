const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const Habit = require("../schemas/habit");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Deletes a habit from the list. Users won't be able to select that habit anymore."),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        let allHabits;
        try {
            allHabits = await Habit.find();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
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
            .setCustomId("remove")
            .setPlaceholder("Choose a habit to remove.")
            .addOptions(selectHabits);

        const row = new ActionRowBuilder().addComponents(select);

        let response;
        try {
            response = await interaction.editReply({
                content: "Choose a habit you want to remove from the database.",
                components: [row]
            });
        } catch (error) {
            await interaction.editReply("Error: Something went wrong. Please try again later.");
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
                if (confirmation.customId === "remove") {
                    try {
                        await Habit.findOneAndDelete({ name: confirmation.values[0] });
                        await confirmation.update({ content: `Successfully removed ${confirmation.values[0]}.` });
                    } catch (error) {
                        await interaction.editReply("Error: Couldn't connect to database. Please try again later.");
                    }
                }
            });
        } catch (e) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    }
}