const { SlashCommandBuilder } = require('discord.js');
const Habit = require("../schemas/habit");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addhabit")
        .setDescription("Add a habit to the database.")
        .addStringOption(option => option.setName("name")
            .setDescription("The name of the habit you want to add.")
            .setRequired(true)
        )
        .addStringOption(option => option.setName("description")
            .setDescription("The description of the habit.")
            .setRequired(true)
        ),
    onlyAdmin: true,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let allHabits;
        try {
            allHabits = await Habit.find();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        try {
            const alreadyExists = await Habit.findOne({ name: interaction.options.get("name").value });
            if (alreadyExists) {
                await interaction.editReply("Error: Habit already exists. Please choose another name.");
                return;
            }
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        let id = allHabits.length + 1;
        const habit = {
            habitId: id,
            name: interaction.options.get("name").value,
            description: interaction.options.get("description").value,
            pointsWorth: 1,
        };

        const newHabit = new Habit(habit);

        try {
            await newHabit.save();
            await interaction.editReply("Successfully added habit.");
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }
    }
}