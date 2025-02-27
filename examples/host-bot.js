const { createBot, LOG_LEVELS } = require("bonkbot");
// const { createBot, LOG_LEVELS } = require("../src/index");


// Create a bot instance
const bot = createBot({
	account: {
		username: "bonkbot",
		guest: true,
	},
	PROTOCOL_VERSION: 49,
	logLevel: LOG_LEVELS.WARN,
});

// Handle ready event
bot.events.on("ready", async () => {
	console.log("Bot is ready!");

	// Connect to the server
	await bot.connect()

	// Create a room after connecting
	await bot.createRoom({
		roomname: "BonkBot's Room",
		maxplayers: 2,
		roompassword: "",
		hidden: false
	});
});

// Handle connect event
bot.events.on("ready", function() {
	bot.events.on("ROOM_SHARE_LINK", () => {
		console.log(`Bot created room!\nURL: ${bot.getShareLink()}`);
	})

	// Set up packet handler
	bot.events.on("PACKET", function(packet) {
		bot.autoHandlePacket(packet);
	});

	// Handle chat messages
	bot.events.on("CHAT_MESSAGE", function(message) {
		console.log(message.player.username + ": " + message.message);

		// Check for players command
		if (message.message === "!players") {
			var players = bot.getAllPlayers(true);
			var playerNames = [];

			for (var i = 0; i < players.length; i++) {
				playerNames.push(players[i].username);
			}

			bot.chat("Players online (" + players.length + "): " + playerNames.join(", "));
		}
	});
});

// Initialize the bot
bot.init().catch((error) => {
	console.error("Failed to initialize bot:", error);
});