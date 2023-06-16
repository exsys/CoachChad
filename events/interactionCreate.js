const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        if (command.onlyAdmin) {
            let userIsAdmin = false;
            interaction.member.roles.cache.forEach((role, i) => {
                if (role.name === "Moderator" || role.name === "Admin" || role.name === "Team") {
                    userIsAdmin = true;
                }
            });

            if (!userIsAdmin) {
                await interaction.reply({ content: "Bad boy! Only Masters are allowed to use this.", ephemeral: true });
                return;
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.log(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};