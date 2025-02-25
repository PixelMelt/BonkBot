/**
 * Constants used throughout the BonkBot library
 */
// Default skin for bots
const DEFAULT_AVATAR = {
    layers: [],
    bc: 16774557,
};
// Default server
const DEFAULT_SERVER = "b2ny1";
// Socket message types - Server to Client (Incoming)
const SERVER_MESSAGE_TYPES = {
    PLAYER_PINGS: 1,
    ROOM_ADDRESS: 2,
    JOIN_ROOM: 3,
    PLAYER_JOIN: 4,
    PLAYER_LEAVE: 5,
    HOST_LEAVE: 6,
    PLAYER_INPUT: 7,
    READY_CHANGE: 8,
    GAME_END: 13,
    GAME_START: 15,
    STATUS_MESSAGE: 16,
    TEAM_CHANGE: 18,
    TEAMLOCK_TOGGLE: 19,
    CHAT_MESSAGE: 20,
    INITIAL_DATA: 21,
    TIMESYNC: 23,
    PLAYER_KICK: 24,
    MAP_REORDER: 25,
    GAMEMODE_CHANGE: 26,
    CHANGE_ROUNDS: 27,
    MAP_SWITCH: 29,
    TYPING: 30,
    AFK_WARNING: 32,
    MAP_SUGGEST: 33,
    MAP_SUGGEST: 34,
    BALANCE_SET: 36,
    DEBUG_WINNER: 38,
    SAVE_REPLAY: 40,
    HOST_TRANSFER: 41,
    FRIEND_REQUEST: 42,
    COUNTDOWN: 43,
    ABORT_COUNTDOWN: 44,
    PLAYER_LEVEL_UP: 45,
    LOCAL_GAINED_XP: 46,
    STATE: 48,
    ROOM_SHARE_LINK: 49,
    PLAYER_TABBED: 52,
    CURATE_RESULT: 57,
    ROOM_NAME_UPDATE: 58,
    ROOM_PASSWORD_UPDATE: 59,
};
// Socket message types - Client to Server (Outgoing)
const CLIENT_MESSAGE_TYPES = {
    PING_RESPONSE: 1,
    TEST_PING: 2,
    GET_DEBUG: 3,
    SEND_INPUTS: 4,
    TRIGGER_START: 5,
    CHANGE_OWN_TEAM: 6,
    TEAM_LOCK: 7,
    SILENCE_PLAYER: 8,
    KICK_BAN_PLAYER: 9,
    CHAT_MESSAGE: 10,
    INFORM_IN_LOBBY: 11,
    CREATE_ROOM: 12,
    JOIN_ROOM: 13,
    RETURN_TO_LOBBY: 14,
    SET_READY: 16,
    ALL_READY_RESET: 17,
    TIMESYNC: 18,
    SEND_MAP_REORDER: 19,
    SEND_MODE: 20,
    SEND_ROUNDS: 21,
    SEND_MAP_DELETE: 22,
    SEND_MAP_ADD: 23,
    SEND_TYPING: 24,
    CHANGE_OTHER_TEAM: 26,
    SEND_MAP_SUGGEST: 27,
    SEND_BALANCE: 29,
    VERSION_CHECK: 30,
    SEND_DEBUG_WINNER: 31,
    SEND_TEAM_SETTINGS: 32,
    SEND_ARM_RECORD: 33,
    SEND_HOST_CHANGE: 34,
    SEND_FRIENDED: 35,
    SEND_START_COUNTDOWN: 36,
    SEND_ABORT_COUNTDOWN: 37,
    SEND_REQUEST_XP: 38,
    SEND_MAP_VOTE: 39,
    INFORM_IN_GAME: 40,
    GET_PRE_VOTE: 41,
    TABBED: 44,
    DESYNC_TEST: 45,
    SEND_DESYNC_RESPONSE: 46,
    SEND_NO_HOST_SWAP: 50,
    SEND_CURATE: 51,
};
// For backward compatibility, keep the old MESSAGE_TYPES object
// but use the server message types as the default
const MESSAGE_TYPES = {
    ...SERVER_MESSAGE_TYPES,
    ...CLIENT_MESSAGE_TYPES,
};
// Team mappings
const TEAM_NAMES = {
    0: "spectator",
    1: "ffa",
    2: "red",
    3: "blue",
    4: "green",
    5: "yellow",
};
// Gamemode names
const GAMEMODE_NAMES = {
	"b": "classic",
	"ar": "arrows",
	"ard": "death arrrows",
	"sp": "grapple",
	"v": "vtol",
	"f": "football"
}
// Engine names
const ENGINE_NAMES = {
	"b": "bonk",
	"f": "football"
}
// API endpoints
const API = {
    LOGIN: "https://bonk2.io/scripts/login_legacy.php",
    GET_ROOMS: "https://bonk2.io/scripts/getrooms.php",
    GET_ROOM_ADDRESS: "https://bonk2.io/scripts/getroomaddress.php",
	AUTOJOIN: "https://bonk2.io/scripts/autojoin.php"
};
// Socket connection settings
const SOCKET = {
    KEEP_ALIVE_INTERVAL: 5000,
    CONNECTION_TIMEOUT: 10000,
};
// Export all constants
module.exports = {
    DEFAULT_AVATAR,
    DEFAULT_SERVER,
    MESSAGE_TYPES,
	GAMEMODE_NAMES,
	ENGINE_NAMES,
    SERVER_MESSAGE_TYPES,
    CLIENT_MESSAGE_TYPES,
    TEAM_NAMES,
    API,
    SOCKET,
};