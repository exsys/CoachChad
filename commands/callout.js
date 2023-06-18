const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require("../schemas/user");
const Settings = require("../schemas/settings");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("callout")
        .setDescription("Call out a user when you believe their proof is sus.")
        .addUserOption(option => option.setName("user")
            .setDescription("User you want to call out.")
            .setRequired(true)
        )
        .addStringOption(option => option.setName("habit")
            .setDescription("The habit the proof was submitted for.")
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

        let callOuter;
        let user;
        let settings;
        try {
            callOuter = await User.findOne({ discordId: interaction.user.id });
            user = await User.findOne({ discordId: interaction.options.get("user").value });
            settings = await Settings.findOne();
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. Please try again later.");
            return;
        }

        if (!settings) {
            await interaction.editReply("Error: Bot isn't setup yet. Please call /setup first.");
            return;
        }

        if (!settings.seasonOngoing) {
            await interaction.editReply("That's not nice of you to call out people when there's no season going on...");
            return;
        }

        if(settings.seasonPaused) {
            await interaction.editReply("The season is currently paused. Please wait for further announcements.");
            return;
        }

        if (!callOuter) {
            await interaction.editReply("Only participants can call out others, please choose a habit first!");
            return;
        }

        if (callOuter.banned) {
            await interaction.editReply("Sorry pal, but you are not allowed to use commands for this season.");
            return;
        }

        if (!user) {
            await interaction.editReply("The user you want to call out isn't participating yet.");
            return;
        }

        let hasHabit;
        user.habits.forEach(habit => {
            if (habit.name === interaction.options.get("habit").value) hasHabit = habit;
        });

        if (!hasHabit) {
            try {
                await interaction.editReply("The user you want to call out didn't start that habit yet.");
                return;
            } catch (error) {
                console.log("error 0004");
                return;
            }
        }

        if (hasHabit.nextSubmissionTime === 0) {
            await interaction.editReply("The user didn't submit a proof for that habit yet.");
            return;
        }

        const msgEmbed = new EmbedBuilder()
            .setColor(0x67B7D1)
            .setTitle("Callout!")
            .setThumbnail("https://cdn3.emoji.gg/emojis/8322-the-rock-reaction.png")
            .setDescription(`${interaction.user.username} believes the proof of ${user.username} for ${hasHabit.name} is sus.`)
            .setFooter({ text: "Did you already go the gym today?", iconURL: "https://datepsychology.com/wp-content/uploads/2022/09/gigachad.jpg" });

        try {
            await interaction.channel.send({ embeds: [msgEmbed] });
            await interaction.channel.send(`<@${user.discordId}> please submit further proof. If you fail to do so in the next 24 hours, ${interaction.user.username} will be able to steal a point from you!`);
        } catch (error) {
            console.log(error);
        }

        try {
            const calledOutObj = {
                user: user.discordId,
                habit: hasHabit,
                timestampCalledOut: Date.now(),
                timestampOfProof: hasHabit.lastCheckinTime
            };
            callOuter.calledOut.push(calledOutObj);
            await callOuter.save();
            if (robber.discordId === target.discordId) {
                await interaction.editReply("Nothing beats self-motivation, huh? I like that!");
            } else {
                await interaction.editReply("Call out successful");
            }
        } catch (error) {
            await interaction.editReply("Error: Couldn't connect to the database. The fact that you called out a user couldn't be saved.");
        }
    }
}