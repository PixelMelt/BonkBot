const { createBot, LOG_LEVELS } = require("bonkbot");

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

	try {
		// Find a room by name
		const roomInfo = await bot.getAddressFromRoomName("test");
		// const roomInfo = await bot.getAddressFromUrl("https://bonk.io/533118qkpuw");

		console.log(`Found room: ${roomInfo.roomname}`);

		// Set the room address
		bot.setAddress(roomInfo);

		// Connect to the server
		await bot.connect();

		// Join the room
		await bot.joinRoom();

		// with a password

		// await bot.joinRoom({
		// 	password: "32",
		// });

	} catch (error) {
		console.error("Failed to find or connect to room:", error);
	}
});

// Handle connect event
bot.events.on("connect", () => {
	console.log("Bot connected to server!");

	bot.events.on("JOIN", () => {
		bot.chat("Connected to the room!")
	})

	bot.events.on("COUNTDOWN", (msg) => {
		bot.chat(`${msg.countdown}!`);
	})

	bot.events.on("GAME_START", () => {
		bot.chat(`start!`);
	})

	bot.events.on("GAMEMODE_CHANGE", (msg) => {
		bot.chat(`Gamemode changed to ${msg.mode} with engine ${msg.engine}`);
	})

	// Set up packet handler
	bot.events.on("PACKET", (packet) => {
		bot.autoHandlePacket(packet);

		// Ignore spammy packets
		if (packet.type === "TIMESYNC" || packet.type === "PLAYER_PINGS") {
			return;
		}

		console.log("Received packet:", packet);
	});

	// Handle chat messages
	bot.events.on("CHAT_MESSAGE", (message) => {
		console.log(`${message.player.username}: ${message.message}`);

		// Respond to commands
		switch (message.message) {
			case "!ping":
				bot.chat("Pong!");
				break;

			case "!help":
				bot.chat("Available commands: !ping, !help, !players, !host");
				break;

			case "!players":
				const players = bot.getAllPlayers();
				bot.chat(`Players online: ${players.map((p) => p.username).join(", ")}`);
				break;

			case "!host":
				bot.chat(`The host is ${bot.getHost().username}`);
				break;
		}
	});

	// Handle player join events
	bot.events.on("PLAYER_JOIN", (event) => {
		const player = event.player;
		if (player) {
			console.log(`${player.username} joined the room!`);
		}
	});

	// Handle player leave events
	bot.events.on("PLAYER_LEAVE", (event) => {
		const player = event.player;
		if (player) {
			console.log(`${player.username} left the room!`);
		}
	});

	// Handle disconnection
	bot.events.on("disconnect", () => {
		console.log("Bot disconnected from the room!");
	});
});

// Initialize the bot
bot.init().catch((error) => {
	console.error("Failed to initialize bot:", error);
});