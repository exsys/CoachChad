const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("teamup")
        .setDescription("Team up with another user to gain extra points.")
        .addUserOption(option => option.setName("user")
            .setDescription("The user you want to team up with.")
            .setRequired(true)
        ),
    onlyAdmin: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let user;
        let partner;
        let settings;
        try {
            settings = await Settings.findOne();
            user = await User.findOne({ discordId: interaction.user.id });
            partner = await User.findOne({ discordId: interaction.options.get("user").value });
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("Wooa. Calm down motivated boy/girl. The season hasn't started yet.");
            return;
        }

        if(settings.seasonPaused) {
            await interaction.editReply("The season is currently paused. Please wait for further announcements.");
            return;
        }

        if (!user) {
            await interaction.editReply("Please choose a habit first before teaming up with others.");
            return;
        }

        if (user.banned) {
            await interaction.editReply("Sorry pal, but you are not allowed to use commands for this season.");
            return;
        }

        if (!partner) {
            await interaction.editReply("The user you want to team up with doesn't exist in the database yet.");
            return;
        }

        if (partner.banned) {
            await interaction.editReply("Sorry pal, but the person you want to team up with is banned.");
            return;
        }

        if (user.discordId === partner.discordId) {
            await interaction.editReply("Look at this smart-ass over here. You think you can trick Coach Chad, huh? GET IMPROVING!");
            return;
        }

        if (user.partner) {
            await interaction.editReply("Trying to two-time, huh? That's not a good thing to do my friend!");
            return;
        }

        if (partner.partner) {
            await interaction.editReply("The user you want to partner with already has a partner. Sorry pal.");
            return;
        }

        const yesButton = new ButtonBuilder()
            .setCustomId("yes")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
            .setCustomId("no")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        const post = await interaction.channel.send({ content: `<@${partner.discordId}>, <@${user.discordId}> wants to team up with you. Do you accept?\n(Declines automatically after 10 minutes)`, components: [row] });

        try {
            await interaction.editReply("User is choosing.");
        } catch (error) {
            console.log("error 0014");
            // don't return. even if user won't notice, partner can still be saved in database
        }

        // ensures that only the user that was asked can react
        const collectorFilter = i => i.user.id === partner.discordId;
        try {
            const confirmation = await post.awaitMessageComponent({
                time: 600000,
                filter: collectorFilter,
            });
            
            if (confirmation.customId === "yes") {
                user.partner = {
                    discordId: partner.discordId,
                    username: partner.username,
                };
                partner.partner = {
                    discordId: user.discordId,
                    username: user.username,
                };
    
                try {
                    await user.save();
                    await partner.save();
                    await interaction.editReply("Successfully teamed up!");
                    await confirmation.update({ content: "Successfully teamed up!" });
                } catch (error) {
                    await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
                    return;
                }
            }
    
            if (confirmation.customId === "no") {
                await interaction.editReply(`User declined team up.`);
                await confirmation.update({ content: `<@${partner.discordId}> said they don't like you so they won't team up with you.` })
            }
        } catch (error) {
            await interaction.editReply({ content: 'No confirmation received, cancelling.', components: [] });
        }

    }
}