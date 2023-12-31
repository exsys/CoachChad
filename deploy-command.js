require("dotenv").config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`Updating commands...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.APP_ID),
            { body: commands },
        );

        console.log(`Successfully updated ${data.length} application (/) commands.`);
    } catch (error) {
        console.log(error);
    }
})();