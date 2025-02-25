/**
 * Packet parser for BonkBot
 */
const {
  SERVER_MESSAGE_TYPES,
  CLIENT_MESSAGE_TYPES,
} = require("./utils/constants");
const {
  createLogger
} = require("./utils/logger");
// Create logger
const logger = createLogger("PacketParser");

/**
* Parse a packet array into a normalized object
* @param {Array} packet - Packet array from socket
* @returns {Object} Normalized packet object
*/
function parsePacket(packet) {
  if (!Array.isArray(packet) || packet.length < 1) {
      return {
          type: "unknown",
          raw: packet
      };
  }

  const messageType = packet[0];

  // Handle server-to-client packets (incoming)
  switch (messageType) {
      case SERVER_MESSAGE_TYPES.PLAYER_PINGS:
          return {
              type: "PLAYER_PINGS",
                  pings: packet[1],
                  pingId: packet[2],
          };

      case SERVER_MESSAGE_TYPES.ROOM_ADDRESS:
          return {
              type: "ROOM_ADDRESS",
                  address: packet[1],
          };

      case SERVER_MESSAGE_TYPES.JOIN_ROOM:
          return {
              	type: "JOIN_ROOM",
				myid: packet[1],
				hostid: packet[2],
				playerdata: packet[3],
				timestamp: packet[4],
				teamslocked: packet[5],
				roomid: packet[6],
				roombypass: packet[7],
          };

      case SERVER_MESSAGE_TYPES.PLAYER_JOIN:
          const isGuest = packet[4] === true;
          return {
              	type: "PLAYER_JOIN",
				id: packet[1],
				peerid: packet[2],
				username: packet[3],
				guest: isGuest,
				level: isGuest ? "0" : packet[5],
				team: packet[6] || 1, // Default to FFA if not provided
				avatar: packet[packet.length - 1], // Avatar is always the last item
          };

      case SERVER_MESSAGE_TYPES.PLAYER_LEAVE:
          return {
              	type: "PLAYER_LEAVE",
				id: packet[1],
				tick: packet[2],
          };

      case SERVER_MESSAGE_TYPES.HOST_LEAVE:
          if (packet[2] === -1) {
				return {
					type: "HOST_LEAVE",
					gameclose: true,
					oldid: packet[1],
				};
          } else {
              return {
                  type: "HOST_LEAVE",
                  gameclose: false,
                  oldid: packet[1],
                  newid: packet[2],
                  timestamp: packet[3],
              };
          }

	case SERVER_MESSAGE_TYPES.PLAYER_INPUT:
		let invalid = false
		if (
			!packet[2] ||
			!packet[2].hasOwnProperty("f") ||
			!packet[2].hasOwnProperty("c") ||
			!packet[2].hasOwnProperty("i")
		) {
			invalid = true
		}

		return {
			type: "PLAYER_INPUT",
			id: packet[1],
			input: packet[2].i,
			frame: packet[2].f,
			sequence: packet[2].c,
			invalid: invalid,
		};

	case SERVER_MESSAGE_TYPES.READY_CHANGE:
		return {
			type: "READY_CHANGE",
			id: packet[1],
			ready: packet[2],
		};

	case SERVER_MESSAGE_TYPES.GAME_END:
		return {
			type: "GAME_END"
		};

	case SERVER_MESSAGE_TYPES.GAME_START:
		return {
			type: "GAME_START",
			timestamp: packet[1],
			mapData: packet[2],
			state: packet[3],
		};

	case SERVER_MESSAGE_TYPES.STATUS_MESSAGE:
		return {
			type: "STATUS_MESSAGE",
			status: packet[1],
		};

	case SERVER_MESSAGE_TYPES.TEAM_CHANGE:
		return {
			type: "TEAM_CHANGE",
			id: packet[1],
			team: packet[2],
		};

	case SERVER_MESSAGE_TYPES.TEAMLOCK_TOGGLE:
		return {
			type: "TEAMLOCK_TOGGLE",
			locked: packet[1],
		};

	case SERVER_MESSAGE_TYPES.CHAT_MESSAGE:
		return {
			type: "CHAT_MESSAGE",
			id: packet[1],
			message: packet[2],
		};

	case SERVER_MESSAGE_TYPES.INITIAL_DATA:
		return {
			type: "INITIAL_DATA",
			...packet[1],
		};

	case SERVER_MESSAGE_TYPES.TIMESYNC:
		return {
			type: "TIMESYNC",
			time: packet[1].result,
			id: packet[1].id,
		};

	case SERVER_MESSAGE_TYPES.PLAYER_KICK:
		return {
			type: "PLAYER_KICK",
			id: packet[1],
		};

	case SERVER_MESSAGE_TYPES.MAP_REORDER:
		return {
			type: "MAP_REORDER",
			start: packet[1],
			end: packet[2],
		};

	case SERVER_MESSAGE_TYPES.GAMEMODE_CHANGE:
		return {
			type: "GAMEMODE_CHANGE",
			engine: packet[1],
			mode: packet[2],
		};

	case SERVER_MESSAGE_TYPES.CHANGE_ROUNDS:
		return {
			type: "CHANGE_ROUNDS",
			rounds: packet[1],
		};

	case SERVER_MESSAGE_TYPES.MAP_SWITCH:
		return {
			type: "MAP_SWITCH",
			mapdata: packet[1],
		};

	case SERVER_MESSAGE_TYPES.TYPING:
		return {
			type: "TYPING",
			id: packet[1],
		};

	case SERVER_MESSAGE_TYPES.AFK_WARNING:
		return {
			type: "AFK_WARNING",
		};

	case SERVER_MESSAGE_TYPES.MAP_SUGGEST:
		return {
			type: "MAP_SUGGEST",
			mapdata: packet[1],
			id: packet[2],
		};

	case SERVER_MESSAGE_TYPES.MAP_SUGGEST:
		return {
			type: "MAP_SUGGEST",
			maptitle: packet[1],
			mapauthor: packet[2],
			id: packet[3],
		};

	case SERVER_MESSAGE_TYPES.BALANCE_SET:
		return {
			type: "BALANCE_SET",
			id: packet[1],
			balance: packet[2],
		};

	case SERVER_MESSAGE_TYPES.DEBUG_WINNER:
		return {
			type: "DEBUG_WINNER",
			id: packet[1],
			data: packet[2],
		};

	case SERVER_MESSAGE_TYPES.SAVE_REPLAY:
		return {
			type: "SAVE_REPLAY",
			id: packet[1],
		};

	case SERVER_MESSAGE_TYPES.HOST_TRANSFER:
		return {
			type: "HOST_TRANSFER",
			oldHost: packet[1].oldHost || packet[1],
			newHost: packet[1].newHost || packet[2],
		};

	case SERVER_MESSAGE_TYPES.FRIEND_REQUEST:
		return {
			type: "FRIEND_REQUEST",
			id: packet[1],
		};

	case SERVER_MESSAGE_TYPES.COUNTDOWN:
		return {
			type: "COUNTDOWN",
			countdown: packet[1],
		};

	case SERVER_MESSAGE_TYPES.ABORT_COUNTDOWN:
		return {
			type: "ABORT_COUNTDOWN",
		};

	case SERVER_MESSAGE_TYPES.PLAYER_LEVEL_UP:
		return {
			type: "PLAYER_LEVEL_UP",
			sid: packet[1].sid,
			level: packet[1].lv,
		};

	case SERVER_MESSAGE_TYPES.LOCAL_GAINED_XP:
		const xpData = packet[1];
		if (xpData.newLevel) {
			return {
				type: "LOCAL_GAINED_XP",
				xp: xpData.newXP,
				level: xpData.newLevel,
				token: xpData.newToken,
			};
		} else {
			return {
				type: "LOCAL_GAINED_XP",
				xp: xpData.newXP,
			};
		}

	case SERVER_MESSAGE_TYPES.STATE:
		return parseStatePacket(packet[1]);

	case SERVER_MESSAGE_TYPES.ROOM_SHARE_LINK:
		return {
			type: "ROOM_SHARE_LINK",
			roomId: packet[1],
			roomBypass: packet[2],
		};

	case SERVER_MESSAGE_TYPES.PLAYER_TABBED:
		return {
			type: "PLAYER_TABBED",
			id: packet[1],
			tabbed: packet[2],
		};

	case SERVER_MESSAGE_TYPES.CURATE_RESULT:
		return {
			type: "CURATE_RESULT",
			success: packet[1],
			message: packet[2],
		};

	case SERVER_MESSAGE_TYPES.ROOM_NAME_UPDATE:
		return {
			type: "ROOM_NAME_UPDATE",
			name: packet[1],
		};

	case SERVER_MESSAGE_TYPES.ROOM_PASSWORD_UPDATE:
		return {
			type: "ROOM_PASSWORD_UPDATE",
			passwordSet: packet[1] === 1,
		};

	default:
		logger.debug("Unknown message type", {
			type: messageType,
			packet
		});
		return {
			type: "unknown",
			messageType,
			data: packet.slice(1),
		};
  }
}

/**
* Parse a state packet into a normalized object
* @param {Object} data - State packet data
* @returns {Object} Normalized state packet
*/
function parseStatePacket(data) {
	return {
		type: "STATE",
		gt: data.gt,
		rounds: data.wl,
		quickplay: data.q,
		teamsLocked: data.tl,
		teams: data.tea,
		engine: data.ga,
		mode: data.mo,
		balance: data.bal,
		inputs: data.inputs,
		framecount: data.fc,
		stateID: data.stateID,
		admin: data.admin,
		map: data.gs ? data.gs.map : null,
		state: data.state,
		random: data.random,
	};
}

module.exports = {
  parsePacket
};