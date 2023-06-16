const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, } = require('discord.js');
const User = require("../schemas/user");

module.exports = {
    data: new SlashCommandBuilder().setName("changetimezone").setDescription("Changes your timezone."),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // create timezone select
        let timezoneSelect = [];
        for (let i = -12; i <= 12; i++) {
            if (i < 0) {
                timezoneSelect.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`GMT ${i}`)
                        .setValue(i.toString()),
                );
            } else {
                timezoneSelect.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`GMT +${i}`)
                        .setValue(i.toString()),
                );
            }
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId("timezone")
            .setPlaceholder("Change your timezone.")
            .addOptions(timezoneSelect);

        const row = new ActionRowBuilder().addComponents(select);
        let response;
        try {
            response = await interaction.editReply({
                content: "Select your timezone.",
                components: [row]
            });
        } catch (error) {
            console.log("error 0001");
            return;
        }

        // ensures that only the user who triggered the original interaction can use the buttons.
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({
                time: 60000,
                filter: collectorFilter,
            });

            if (confirmation.customId === "timezone") {
                const user = await User.findOne({ discordId: interaction.user.id });
                if (!user) {
                    await confirmation.update({ content: "Couldn't find user. Please choose a habit first." });
                    return;
                }

                try {
                    user.timezone = confirmation.values[0];
                    await user.save();
                    await confirmation.update({ content: "Successfully changed timezone." });
                } catch (error) {
                    await confirmation.update({ content: "Error: Changing timezone failed. Please try again later." });
                    return;
                }
            }
        } catch (error) {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    }
}