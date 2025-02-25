const BonkBot = require("./bonkbot.js");

let bot = BonkBot.createBot({
  account: {
    username: "me",
    password: "K3FmWyDhqCz4kycj",
    guest: false,
  },
  // skin: "{skin_object_here}"
});

bot.events.on("ready", async () => {
  console.log("Bot is ready");
  console.log(bot);

  // let fromurl = await bot.getAddressFromLink("https://bonk.io/710561")
  // let fromroomname = await bot.getAddressFromRoomName("test")
  let addr = await bot.createRoom(bot);

  bot.setAddress(addr);
  bot.connect();
});

bot.events.on("connect", () => {
  console.log("Bot connected to room!");

  bot.events.on("packet", async (packet) => {
    bot.autoHandlePacket(packet);
    // ignore spammy packets
    if (packet.type == "timesync") return;
    if (packet.type == "ping") return;
    console.log(packet);
  });

  bot.events.on("banned", async () => {
    console.log("Bot was banned from the room!");
  });

  bot.events.on("disconnected", async () => {
    console.log("Bot disconnected from the room!");
  });

  bot.events.on("chatmessage", async (playerchatevent) => {
    let pce = playerchatevent;
    console.log(`${pce.username}: ${pce.message}`);

    // commands!
    if (pce.message == "!ping") {
      bot.chat("Pong!");
    }
  });

  bot.events.on("join", async (playerjoinevent) => {
    let joiningPlayer = bot.getPlayerByID(playerjoinevent.id);
    console.log(`${joiningPlayer.username} joined the room!`);
  });

  bot.events.on("leave", async (playerleaveevent) => {
    let leavingPlayer = bot.getPlayerByID(playerleaveevent.id);
    console.log(`${leavingPlayer.username} left the room!`);
  });
});

bot.init();
