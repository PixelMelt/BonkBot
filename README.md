# BonkBot.js

BonkBot is a JavaScript botting library for hit web game [Bonk.io](https://bonk.io). It provides an easy way to create custom bots that can automate various actions within the game. With BonkBot, you can interact with the game's websocket protocol easily. For example you can chat with other players, and perform actions such as joining and leaving rooms, all within bonkbot.

## Installation
To install BonkBot, you will need [Node.js](https://nodejs.org/en/download/) installed on your system. Then, run the following command in your terminal:
```
npm i bonkbot
```

## Usage
To use BonkBot, you'll need to create a bot instance and specify your game account information.

Here's a sample code that demonstrates how to use BonkBot:

```JS
const BonkBot = require('bonkbot');

let bot = BonkBot.createBot({
    account: {
        username: "pixelmelt",
        password: `password123`,
        guest: false,
    },
    // skin: '{skin_object_here}'
});

bot.events.on('ready', async () => {
    console.log('Bot is ready');

    // let fromurl = await bot.getAddressFromLink('https://bonk.io/710561')
    let fromroomname = await bot.getAddressFromRoomName("me's game")

    bot.setAddress(fromroomname)
    bot.connect();
});

bot.events.on('connect', () => {
    console.log('Bot connected to room!');
    
    bot.events.on('packet', async (packet) => {
        bot.autoHandlePacket(packet)
        // ignore spammy packets
        if (packet.type == 'timesync') return;
        if (packet.type == 'ping') return;
        console.log(packet);
    });

    bot.events.on('banned', async () => {
        console.log('Bot was banned from the room!');
    });

    bot.events.on('disconnected', async () => {
        console.log('Bot disconnected from the room!');
    });
    
    bot.events.on('chatmessage', async (playerchatevent) => {
        let pce = playerchatevent
        console.log(`${pce.username}: ${pce.message}`);

        // commands!
        if(pce.message == "!ping"){
            bot.chat("Pong!");
        }
    });

    bot.events.on('join', async (playerjoinevent) => {
        let joiningPlayer = bot.getPlayerByID(playerjoinevent.id)
        console.log(`${joiningPlayer.username} joined the room!`);
    })

    bot.events.on('leave', async (playerleaveevent) => {
        let leavingPlayer = bot.getPlayerByID(playerleaveevent.id)
        console.log(`${leavingPlayer.username} left the room!`);
    })
});

bot.init();
```



## Contributing
Contributions are always welcome! If you find a bug or have a feature request, please open an issue on the project's GitHub page.

## License
BonkBot is open-source software licensed under the [GPL3 License](https://www.gnu.org/licenses/gpl-3.0.en.html)
