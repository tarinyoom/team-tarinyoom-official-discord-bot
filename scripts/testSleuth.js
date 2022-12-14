const { messageLink, time, Client, GatewayIntentBits, TimestampStyles } = require('discord.js');
const secretManager = require('./secretManager');
const registerCommands = require('./discord/registerCommands');
const sleuther = require('./discord/sleuther');
const searcher = require('./discord/searcher');
let client;

async function handleSearch(interaction) {

	// Retrieve message IDs with search
	const target = interaction.options.getString('target');
	const results = await searcher.search(target, interaction.guildId, 1);

	// Get the actual messages
	const channels = client.guilds.cache.get(interaction.guildId).channels.cache;
	const messages = await Promise.all(results.map(
		async result => await channels.get(result.channelId).messages.fetch(result.messageId)));

	// Format messages for output to screen
	function formatMessage(m) {
		let output = "";
		output += `> ${m.content}\n`
		output += `from \`${m.author.username}#${m.author.discriminator}\` on ${time(Math.round(m.createdTimestamp / 1000), "F")}\n`;
		output += `<${messageLink(m.channelId, m.id, m.guildId)}>`
		return output;
	}

	const outputData = messages
		.map(message => formatMessage(message))
		.join("\n\n");

	await interaction.reply({ content: `Search results for "${target}":\n\n${outputData}`, ephemeral: true });
}

async function handleSleuth(interaction) {
	sleuthingInitiated = await sleuther.initiateSleuthing(client, interaction.guildId, () => {
		console.log("done sleuthing");
	});

	if (sleuthingInitiated) {
		await interaction.reply(`Server-wide sleuthing initiated...`);
	} else {
		await interaction.reply(`I'm already sleuthing here, buddy!`); // TODO: could provide some progress metrics perhaps
	}
}

async function handleSleuthnt(interaction) {
	await interaction.reply({content: `Sleuthnt not yet implemented :monkaS:`, ephemeral: true});
}

async function handleStats(interaction) {
	await interaction.reply({content: `Sleuth stats: <stats>`, ephemeral: true});
}

function buildOnReady(secrets) {
	return () => {
		registerCommands.register(secrets);
		console.log("Bot ready!");
	};
};

function buildOnInteractionCreate() {
	return async interaction => {
		if (!interaction.isChatInputCommand()) return;

		const { commandName } = interaction;

		switch (commandName) {
			case 'tsleuth':
				try {
					await handleSleuth(interaction);
				} catch (error) {
					console.error(`Error when responding to sleuth command: ${error}`);
				}
				break;
			case 'tsearch':
				try {
					await handleSearch(interaction);
				} catch (error) {
					console.error(`Error when responding to search command: ${error}`);
				}
				break;
			case 'tsleuthnt':
				try {
					await handleSleuthnt(interaction);
				} catch (error) {
					console.error(`Error when responding to sleuthn't command: ${error}`);
				}
				break;
			case 'tstats':
				try {
					await handleStats(interaction);
				} catch (error) {
					console.error(`Error when responding to stats command: ${error}`);
				}
		}
	};
};

async function runSleuthTest() {
	// Create a new client instance
	client = new Client({ intents: [GatewayIntentBits.Guilds] });
	const secrets = secretManager.getDiscordSecrets();

	client.once('ready', buildOnReady(secrets));
	client.login(secrets.botToken).then( () =>{
		let guildId = "861796985362055168";
		console.log("bout to sleuth");
		sleuther.initiateSleuthing(client, guildId, () => {
			console.log("heh, looks like you've been sleuthed kid");
		});
	});
}

module.exports = { runSleuthTest };

