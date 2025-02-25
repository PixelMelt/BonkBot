# BonkBot.js

BonkBot is a JavaScript library for creating bots for the web game [Bonk.io](https://bonk.io). It provides an easy way to create custom bots that can automate various actions within the game. With BonkBot, you can interact with the game's websocket protocol easily, chat with other players, and perform actions such as joining and leaving rooms.

### V4 Alpha, report any issues/bugs in the issues tab

## Installation

To install BonkBot, you will need [Node.js](https://nodejs.org/en/download/) installed on your system. Then, run the following command in your terminal:

```bash
npm install bonkbot
```

## Features

- Connect to existing rooms or create new ones
- Automatically determine the optimal server using the game's API
- Send and receive chat messages
- Track players joining and leaving
- Manage teams and game settings
- Handle game events
- Comprehensive error handling
- Detailed logging

# Support
[Discord Server](https://discord.gg/USJQjwD7AY)

## Basic Usage

```javascript
const { createBot, LOG_LEVELS } = require('bonkbot');

// Create a bot instance
const bot = createBot({
  account: {
    username: 'BotName',
    guest: true,  // Use guest account
  },
  logLevel: LOG_LEVELS.WARN, // Set log level (DEBUG, INFO, WARN, ERROR, NONE)
});

// Initialize and handle events
bot.events.on('ready', async () => {
  await bot.connect();
});

// Handle chat messages
bot.events.on('CHAT_MESSAGE', (message) => {
  console.log(`${message.player.username}: ${message.message}`);
  
  // Respond to !ping command
  if (message.message === '!ping') {
    bot.chat('Pong!');
  }
});

bot.events.on('PACKET', (packet) => {
  bot.autoHandlePacket(packet);
});

bot.init();
```


## Authentication Examples

### Automatic Server Detection

By default, BonkBot will automatically determine the optimal server to connect to by querying the game's API. This ensures your bot connects to the most appropriate server based on the current game infrastructure.

If you want to override this behavior and connect to a specific server, you can provide the `server` option when creating the bot:

```javascript
const bot = createBot({
  // ... other options
  server: 'b2ny1'  // Force connection to a specific server
});
```

### Guest Account

```javascript
const bot = createBot({
  account: {
    username: 'BotName',
    guest: true
  },
  logLevel: LOG_LEVELS.WARN
});
```

### User Account

```javascript
const bot = createBot({
  account: {
    username: 'YourUsername',
    password: 'YourPassword',
    guest: false
  },
  logLevel: LOG_LEVELS.WARN
});
```

## Connection Flow and Examples

The connection flow typically follows this sequence:
1. Bot initialization (`bot.init()`)
2. Ready event fires when login completes
3. Connect to game server (`bot.connect()`)
4. Find or create room
5. Join room or create room
6. Handle game events

### Joining a Room by Name

```javascript
bot.events.on('ready', async () => {
  try {
    // Find room by name
    const roomInfo = await bot.getAddressFromRoomName("roomName");
    console.log(`Found room: ${roomInfo.roomname}`);
    
    // Set address and connect
    bot.setAddress(roomInfo);
    await bot.connect();
    
    // Join with optional password
    await bot.joinRoom({
      password: "optional-password"
    });
  } catch (error) {
    console.error("Failed to join room:", error);
  }
});
```

### Joining a Room by Link

```javascript
bot.events.on('ready', async () => {
  try {
    // Get room info from share link
    const roomInfo = await bot.getAddressFromUrl("https://bonk.io/123abc");
    console.log(`Found room: ${roomInfo.roomname}`);
    
    // Connect to room
    bot.setAddress(roomInfo);
    await bot.connect();
    await bot.joinRoom();
  } catch (error) {
    console.error("Failed to join room:", error);
  }
});
```

### Creating a Room

```javascript
bot.events.on('ready', async () => {
  try {
    // Connect to server first
    await bot.connect();
    
    // Then create room
    bot.createRoom({
      roomname: "BonkBot Room",
      maxplayers: 10,
      roompassword: "",
      hidden: true
    });
  } catch (error) {
    console.error("Failed to create room:", error);
  }
});

// Get share link when room is created
bot.events.on('ROOM_SHARE_LINK', (data) => {
  console.log(`Room created! URL: ${data.url}`);
});
```

## Available Events

| Event | Description | Returns |
|-------|-------------|---------|
| `ready` | Bot is ready to connect | - |
| `connect` | Connected to server | - |
| `PACKET` | Any packet received | `{type, ...data}` |
| `JOIN` | Joined a room | `{game, room, players}` |
| `PLAYER_JOIN` | Player joined room | `{player, id}` |
| `PLAYER_LEAVE` | Player left room | `{player, id}` |
| `CHAT_MESSAGE` | Chat message received | `{player, message}` |
| `TEAM_CHANGE` | Player changed team | `{player, team}` |
| `HOST_TRANSFER` | Host was transferred | `{oldHost, newHost}` |
| `READY_CHANGE` | Player ready status changed | `{player, ready}` |
| `GAME_START` | Game started | - |
| `GAME_END` | Game ended | - |
| `COUNTDOWN` | Game countdown | `{countdown}` |
| `MAP_SWITCH` | Map was switched | `{map}` |
| `MAP_SUGGEST` | Map was suggested | `{title, author, player}` |
| `CHANGE_ROUNDS` | Round count changed | `{rounds}` |
| `GAMEMODE_CHANGE` | Game mode changed | `{mode, engine}` |
| `ROOM_SHARE_LINK` | Room link created | `{url}` |
| `PLAYER_KICK` | Player was kicked | `player` |
| `PLAYER_TABBED` | Player tabbed in/out | `{player, tabbed}` |
| `PLAYER_INPUT` | Player input received | `{player, movement}` |
| `TEAMLOCK_TOGGLE` | Teams locked/unlocked | `{teamsLocked}` |
| `ROOM_NAME_UPDATE` | Room name changed | `{name}` |
| `ROOM_ADDRESS` | Room address updated | `{address}` |
| `BALANCE_SET` | Player balance changed | `{player, balance}` |
| `disconnect` | Disconnected from server | - |

## Common Methods

```javascript
// Chat message
bot.chat("Hello world");

// Get all players
const players = bot.getAllPlayers();

// Get host
const host = bot.getHost();

// Get room share link
const shareLink = bot.getShareLink();

// Set player ready status
bot.ready(true);

// Join a team (0-5)
bot.joinTeam(2); // 0=spectator, 1=FFA, 2=red, 3=blue...

// Give host to player
bot.giveHost(playerId);

// Kick a player
bot.kickPlayer(playerId);

// Leave the room
bot.leaveGame();
```


## Examples

Check out the `examples` directory for more examples:

- `simple-bot.js`: A basic bot that connects to a room and responds to chat commands
- `host-bot.js`: A bot that creates and hosts a room

## Contributing

Contributions are always welcome! If you find a bug or have a feature request, please open an issue on the project's GitHub page.

## License

BonkBot is open-source software licensed under the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).
