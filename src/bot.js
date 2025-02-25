/**
 * Main Bot class for BonkBot
 */
const EventEmitter = require('events');
const io = require('socket.io-client');
const axios = require('axios');
const {
    createLogger
} = require('./utils/logger');
const {
    DEFAULT_SERVER,
    DEFAULT_AVATAR,
	GAMEMODE_NAMES,
	ENGINE_NAMES,
	TEAM_NAMES,
    CLIENT_MESSAGE_TYPES,
    API,
    SERVER_MESSAGE_TYPES
} = require('./utils/constants');
const {
    parsePacket
} = require('./packet');
const { LOG_LEVELS } = require("./utils/logger");

// Create logger
const logger = createLogger('BonkBot');

/**
 * Main BonkBot class
 */
class BonkBot {
    /**
     * Create a new BonkBot instance
     * @param {Object} options - Bot options
     * @param {Object} options.account - Account information
     * @param {string} [options.account.username] - Username
     * @param {string} [options.account.password] - Password
     * @param {boolean} [options.account.guest=true] - Whether the account is a guest
     * @param {string} [options.avatar] - Bot avatar
     * @param {string} [options.server=b2ny1] - Server to connect to
     * @param {string} [options.bypass] - Pass bypass
     * @param {string} [options.token] - Authentication token
     * @param {string} [options.peerid] - Peer ID
     * @param {number} [options.logLevel=LOG_LEVELS.INFO] - Log level
     */
    constructor(options = {}) {
        // Set log level
        if (options.logLevel !== undefined) {
            logger.setLevel(options.logLevel);
        }

        logger.info('Creating new BonkBot instance');

        // Initialize properties
		this.PROTOCOL_VERSION = options.PROTOCOL_VERSION
		this.HARDCODED_PROTOCOL_VERSION = 49; // dont change this, pass the property to the function

		if(this.PROTOCOL_VERSION == undefined){
			logger.warn("You should really set the PROTOCOL_VERSION to the correct one in the createBot() options object, without it the bot may fail to start")
			logger.warn("Defaulting PROTOCOL_VERSION to: " + this.HARDCODED_PROTOCOL_VERSION)
			this.PROTOCOL_VERSION = this.HARDCODED_PROTOCOL_VERSION;
		}

        this.account = this.validateAccount(options.account || {});
        this.avatar = options.avatar || DEFAULT_AVATAR;
        this.server = options.server || DEFAULT_SERVER;
        this.bypass = options.bypass;
        this.token = options.token;
        this.peerID = options.peerid || this.generatePeerId();


        // Create event emitter
        this.events = new EventEmitter();

        // Socket connection
        this.socket = null;
        this.connected = false;
        this.keepAliveTimer = null;
        this.timeSyncCount = 1;

		this.timeSync = {
			count: 0,
			last_sync: 0,
			last_sync_id: 0,
			latency: 0
		}

        // Room information
        this.room = {
            id: null,
            name: null,
            address: null,
            server: this.server,
            bypass: this.bypass,
            teamsLocked: false,
            password: null,
			countdown: false,

			state: false,
			map: false,
			inGame: false,
			roundStartTime: 0,
			rounds: 3,

			gt: false, // ?

			quickplay: false,
			teams: false,
			mode: false,
			balance: false,
			inputs: false,
			framecount: false,
			stateID: false,
			admin: false,
			random: false,
        };

        // Game state
        this.game = {
            id: null,
            host: null,
            banned: false
        };

        // Player tracking
        this.players = new Map();
    }

    /**
     * Initialize the bot
     * @returns {Promise<BonkBot>} This bot instance
     */
    async init() {
        logger.info('Initializing BonkBot');

        try {
            // Get authentication token if needed
            if (!this.account.guest && !this.token) {
                this.token = await this.getToken(this.account.username, this.account.password);
            }

            // Get server information if using default
            if (!this.server || this.server === DEFAULT_SERVER) {
				logger.info('Getting server information');
                const serverInfo = await this.getServerInfo(this.token);
                this.server = serverInfo.server;
                this.room.server = this.server;
                logger.info(`Using server: ${this.server}`);
            }

            logger.info('BonkBot initialized');
            this.events.emit('ready');

            return this;
        } catch (error) {
            logger.error('Failed to initialize BonkBot', error);
            throw error;
        }
    }

	/**
     * Start the keep alive timer
     * @private
     */
    startKeepAlive() {
        this.keepAliveTimer = setInterval(() => {
            if (this.connected) {
                // Verify the socket is still connected before sending keep-alive
                if (this.socket && this.socket.connected) {
                    this.sendTimesync();
                } else {
                    logger.warn('Keep-alive detected disconnected socket');
                    
					this.stopBot();
                    this.events.emit('disconnect');
                }
            }
        }, 5000);
    }

	/**
     * Set the room address
     * @param {Object} addressInfo - Room address information
     */
    setAddress(addressInfo) {
        logger.info('Setting room address');

        if (!addressInfo.address || !addressInfo.roomname || !addressInfo.server) {
            throw new Error('Invalid room address information');
        }

        this.room.address = addressInfo.address;
        this.room.name = addressInfo.roomname;
        this.room.server = addressInfo.server;
        this.room.bypass = addressInfo.bypass || '';

        // Update server if different
        if (this.server !== addressInfo.server) {
            this.server = addressInfo.server;
        }

        logger.info(`Set room address: ${this.room.name} (${this.room.address})`);
    }

    /**
     * Connect to the server
     * @returns {Promise<BonkBot>} This bot instance
     */
    async connect() {
        if (this.connected) {
            logger.warn('Already connected, disconnecting first');
            this.disconnect();
        }

        logger.info(`Connecting to server: ${this.server}`);

        const socketAddr = `https://${this.server}.bonk.io`;

        return new Promise((resolve, reject) => {
            try {
                // Connect using socket.io v2.x
                this.socket = io(socketAddr, {
                    transports: ['websocket'],
                    reconnection: false,
                    timeout: 10000,
                    forceNew: true,
                    path: '/socket.io'
                });

                // Set up connection timeout
                const timeout = setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error(`Connection timeout to server: ${this.server}`));
                        this.stopBot();
                    }
                }, 10000);

                // Connection opened
                this.socket.on('connect', () => {
                    logger.info('Socket.IO connection established');

                    clearTimeout(timeout);
                    this.connected = true;

                    // Set up event handlers
                    this.setupSocketEvents();

                    // Start keep alive timer
                    this.startKeepAlive();

                    // Emit connect event
                    this.events.emit('connect');

                    resolve(this);
                });

                // Connection error
                this.socket.on('error', (error) => {
                    logger.error('Socket.IO connection error', error);

                    if (!this.connected) {
                        clearTimeout(timeout);
                        reject(new Error(`Failed to connect to server: ${error.message || error}`));
                    }

                    this.events.emit('error', error);
                });

                // Connection closed
                this.socket.on('disconnect', (reason) => {
                    logger.info(`Socket.IO connection closed: ${reason}`);

                    if (!this.connected) {
                        clearTimeout(timeout);
                        reject(new Error(`Connection closed before fully established: ${reason}`));
                    }

                    this.stopBot();
                    this.events.emit('disconnect');
                });
            } catch (error) {
                reject(new Error(`Failed to create Socket.IO connection: ${error.message}`));
            }
        });
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (!this.connected) {
            logger.warn('Not connected, nothing to disconnect');
            return;
        }

        logger.info('Disconnecting from server');

        this.stopBot();

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Get a room address from a room name
     * @param {string} roomName - Room name
     * @returns {Promise<Object>} Room address information
     */
    async getAddressFromRoomName(roomName) {
        logger.info(`Getting address for room: ${roomName}`);

        try {
            // Find room by name
            const room = await this.getRoomByNam(roomName, this.token);

            if (!room) {
                throw new Error(`Room not found: ${roomName}`);
            }

            // Get room address
            const address = await this.getRoomAddress(room.id);

            const result = {
                roomname: room.roomname,
                address: address.address,
                server: address.server,
                bypass: ''
            };

            logger.info(`Got address for room: ${roomName}`);

            return result;
        } catch (error) {
            logger.error(`Failed to get address for room: ${roomName}`, error);
            throw error;
        }
    }

    async getAddressFromUrl(url) {
		const regex = /\/(\d{6})([a-zA-Z0-9]{5})?$/;
		const match = url.match(regex);
	  
		if (!match) {
		  return null;
		}
	  
		const id = match[1];
		const bypass = match[2] || "";
	  
		const data = new URLSearchParams();
		data.append('joinID', id);
	  
		try {
		  const response = await axios.post(API.AUTOJOIN, data.toString(), {
			headers: {
			  'Content-Type': 'application/x-www-form-urlencoded'
			}
		  });
	  
		  const result = response.data;
		  
		  if (result.r == "success") {
			result.bypass = bypass;
		  }

		  return result;
		} catch (error) {
		  console.error('Error getting join link:', error);
		  throw error; // Re-throw to allow caller to handle the error
		}
	  }

    /**
     * Join a room
     * @param {Object} [options] - Join options
     * @returns {Promise<void>} Resolves when joined
     */
    async joinRoom(options = {}) {
        if (!this.connected) {
            throw new Error('Not connected to server');
        }

        if (!this.room.address) {
            throw new Error('Room address not set');
        }

        logger.info(`Joining room: ${this.room.name} (${this.room.address})`);

        // Prepare join data
        const joinData = {
            joinID: this.room.address,
            roomPassword: options.password.toString() || '',
            guest: this.account.guest,
            dbid: 2,
            version: this.PROTOCOL_VERSION,
            peerID: options.peerid || this.peerID,
            bypass: this.room.bypass || '',
            avatar: this.avatar
        };

        // Add account-specific data
        if (this.account.guest) {
            joinData.guestName = this.account.username;
        } else {
            joinData.token = this.token;
        }

        // Send join message
        this.sendMessage(CLIENT_MESSAGE_TYPES.JOIN_ROOM, joinData);

        logger.info(`Join request sent for room: ${this.room.name}`);
    }

    /**
     * Create a new room
     * @param {Object} [options] - Room options
     * @returns {Promise<Object>} Room address information
     */
    async createRoom(options = {}) {
        if (!this.connected) {
            throw new Error('Not connected to server');
        }

        logger.info('Creating new room');

        // Set room info
        this.room.name = options.roomname || `BonkBot Room ${Math.floor(Math.random() * 1000)}`;
        this.room.maxPlayers = options.maxplayers || 8;
        this.room.password = options.roompassword || '';

        // Prepare create data
		const createData = {
			peerID: options.peerid ?? this.peerID,
			roomName: options.roomName ?? this.room.name,
			maxPlayers: options.maxPlayers ?? this.room.maxPlayers,
			password: options.password ?? this.room.password,
			dbid: options.dbid ?? 11822936,
			guest: options.guest ?? this.account.guest,
			minLevel: options.minLevel ?? 0,
			maxLevel: options.maxLevel ?? 999,
			latitude: options.latitude ?? 0,
			longitude: options.longitude ?? 0,
			country: options.country ?? 'US',
			version: this.PROTOCOL_VERSION,
			hidden: options.hidden ? 1 : 0,
			quick: options.quick ?? false,
			mode: options.mode ?? 'custom',
			token: options.token ?? (this.token || ''),
			avatar: options.avatar ?? this.avatar,
		};
		if(createData.guest){
			createData.guestName = this.account.username;
		}

        // Send create message
        this.sendMessage(CLIENT_MESSAGE_TYPES.CREATE_ROOM, createData);

		// set the only player to yorself
		this.players.set(0, {
			peerID: createData.peerID,
			guest: createData.guest,
			team: 1,
			teamName: TEAM_NAMES[1],
			level: 0,
			ready: false,
			tabbed: false,
			avatar: createData.avatar,
			id: 0,
			username: createData.guestName,
			xp: 0,
			ping: 0,
			balance: 0,
			host: true,
			movement: {
				input: 0,
				frame: 0,
				sequence: 0
			}
		});

		this.game.id = 0
		this.game.host = 0

        logger.info(`Room creation request sent: ${this.room.name}`);

		this.events.emit('CREATE_ROOM');

        // Return room info
        return {
            address: this.room.address,
            roomname: this.room.name,
            server: this.room.server,
            bypass: this.room.bypass
        };
    }

	getShareLink(){
		return "https://bonk.io/" + this.room.dbid + this.room.bypass;
	}

    /**
     * Get a player by ID
     * @param {string|number} id - Player ID
     * @returns {Object|null} Player object or null if not found
     */
    getPlayerByID(id) {
        return this.players.get(id) || null;
    }

	/**
	 * Get a players id by username
	 * @param {string} username - Player username
	 * @param {boolean} guest - Whether the player is a guest
	 * @returns {number} Player ID
	 */
	getPlayerIDByUsername(username, guest = false) {
		for (const player of this.players.values()) {
			console.log(player)
			if (player.username == username && player.guest == guest) {
				return player.id;
			}
		}

		return -1;
	}

    /**
     * Get all players
     * @returns {Array<Object>} Array of player objects
     */
    getAllPlayers() {
        const players = [];

        for (const player of this.players.values()) {
            players.push(player);
        }

        return players;
    }

    /**
     * Send a chat message
     * @param {string} message - Message to send
     */
    chat(message) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.CHAT_MESSAGE, {
            message
        });
    }

    /**
     * Set player ready status
     * @param {boolean} ready - Ready status
     */
    ready(ready) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.SET_READY, {
            ready
        });
    }

    /**
     * Join a team
     * @param {number} team - Team to join
     */
    joinTeam(team) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.CHANGE_OWN_TEAM, {
            targetTeam: team
        });
    }

    /**
     * Toggle teams lock
     * @param {boolean} locked - Whether teams are locked
     */
    toggleTeams(locked) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.TEAM_LOCK, {
            teamLock: locked
        });
    }

    /**
     * Ban a player
     * @param {string|number} playerId - Player ID to ban
     */
    banPlayer(playerId) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.KICK_BAN_PLAYER, {
            banshortid: playerId
        });
    }

    /**
     * Leave the game
     */
    leaveGame() {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.RETURN_TO_LOBBY);
    }

    /**
     * Give host to another player
     * @param {string|number} playerId - Player ID to give host to
     */
    giveHost(playerId) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.SEND_HOST_CHANGE, {
            id: playerId
        });
    }

	/**
	 * Get the host player
	 * @returns {Object} Host player object
	 */
	getHost(){
		return this.players.get(this.game.host);
	}

    /**
     * Set number of rounds
     * @param {number} rounds - Number of rounds
     */
    setRounds(rounds) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.SEND_ROUNDS, {
            w: rounds
        });
    }

    /**
     * Send an input to the game
     * @param {Object} input - Input data
     */
    sendInput(input) {
        this.checkConnection();
        this.sendMessage(CLIENT_MESSAGE_TYPES.SEND_INPUTS, {
            i: input.input,
            f: input.frame,
            c: input.sequence
        });
    }

    /**
     * Automatically handle a packet
     * @param {Object} packet - Packet to handle
     */
    autoHandlePacket(packet) {
        switch (packet.type) {

			case 'ROOM_SHARE_LINK':
				this.room.dbid = packet.roomId;
				this.room.bypass = packet.roomBypass;
				
				this.events.emit('ROOM_SHARE_LINK', { url: this.getShareLink() });
				break;

			case 'MAP_SWITCH':
				this.room.map = packet.mapdata;
				this.events.emit('MAP_SWITCH', { map: this.room.map });
				break;

			case 'MAP_SUGGEST':
				const mapSuggestion = {
					title: packet.maptitle,
					author: packet.mapauthor,
					player: this.players.get(packet.id)
				}
				this.events.emit('MAP_SUGGEST', mapSuggestion);
				break;

			case 'CHANGE_ROUNDS':
				this.room.rounds = packet.rounds;
				this.events.emit('CHANGE_ROUNDS', { rounds: packet.rounds });
				break;
			
			case 'COUNTDOWN':
				this.room.countdown = packet.countdown;
				this.events.emit('COUNTDOWN', { countdown: packet.countdown });
				break;

			case 'GAME_START':
				// THIS NEEDS WORK
				// COULD CAUSE DESYNC IF PLAYERS ARE FKING WITH THE STATE OBJ WITHOUT TELLING OTHERS

				this.room.inGame = true;
				this.room.roundStartTime = packet.timestamp;
				this.room.state = packet.state;
				
				this.room.map = packet.state.map;
				this.room.gt = packet.state.gt;
				this.room.rounds = packet.state.wl;
				this.room.quickplay = packet.state.q;
				this.room.teamsLocked = packet.state.tl;
				this.room.teams = packet.state.tea;
				this.room.engine = ENGINE_NAMES[packet.state.ga];
				this.room.mode = GAMEMODE_NAMES[packet.state.mo];
				
				// apply balances to all the players
				// bal[playerid] = num
				this.players.forEach((player) => {
					player.balance = packet.state.bal[player.id] || 0;
					this.players.set(player.id, player);
				});

				this.events.emit('GAME_START');
				break;

			case 'GAME_END':
				this.room.inGame = false;
				this.events.emit('GAME_END');
				break;

			case 'GAMEMODE_CHANGE':
				this.room.mode = GAMEMODE_NAMES[packet.mode];
				this.room.engine = ENGINE_NAMES[packet.engine];

				this.events.emit('GAMEMODE_CHANGE', { mode: this.room.mode, engine: this.room.engine });
				break;

			case 'BALANCE_SET':
				const playerBalance = this.players.get(packet.id);

				if (playerBalance) {
					playerBalance.balance = packet.balance;
					this.players.set(packet.id, playerBalance);
				}

				this.events.emit('BALANCE_SET', { player: playerBalance, balance: packet.balance });
				break;

			case 'TIMESYNC':
				this.timeSync.last_sync = packet.time;
				this.timeSync.last_sync_id = packet.id;
				this.timeSync.latency = Date.now() - this.timeSync.last_sync;
				break;

			case 'TEAM_CHANGE':
				// Update player team
				const playerTeam = this.players.get(packet.id);

				if (playerTeam) {
					playerTeam.team = packet.team;
					playerTeam.teamName = TEAM_NAMES[packet.team];
					this.players.set(packet.id, playerTeam);
				}

				// Emit team change event
				this.events.emit('TEAM_CHANGE', { player: playerTeam, team: packet.team });
				break;

			case 'PLAYER_PINGS':
				// Update player pings
				// pings: { '0': 14 }
				for (let [id, ping] of Object.entries(packet.pings)) {
					id = parseInt(id)
					const playerPing = this.players.get(id);
					playerPing.ping = ping;
					this.players.set(id, playerPing);
				}

				this.sendMessage(CLIENT_MESSAGE_TYPES.PING_RESPONSE, { id: packet.pingId })
				break;

			case 'CHAT_MESSAGE':
				// Handle chat message
				const player = this.players.get(packet.id);

				this.events.emit('CHAT_MESSAGE', { player: player, message: packet.message });
				break;

            case 'JOIN_ROOM':
                // Set game info
                this.game.id = packet.myid;
                this.game.host = packet.hostid;
				// Set room info
                this.room.id = packet.roomid;
                this.room.bypass = packet.roombypass;
                this.room.teamsLocked = packet.teamsLocked;

                // Add players
                if (packet.playerdata && Array.isArray(packet.playerdata)) {
                    for (let i = 0; i < packet.playerdata.length; i++) {
                        const playerData = packet.playerdata[i];
                        if (playerData) {
                            playerData.id = i;

                            playerData.username = playerData.userName;
                            delete playerData.userName;

                            playerData.xp = this.levelToXP(playerData.level)
							playerData.ping = 0;
							playerData.balance = 0;
							playerData.movement = {
								input: 0,
								frame: 0,
								sequence: 0
							}

                            this.players.set(i, playerData);
                        }
                    }
                }

				packet.players = this.players;
				delete packet.playerdata;

                // Emit join event
                this.events.emit('JOIN', { game: this.game, room: this.room, players: this.players });
                break;

			case 'INITIAL_DATA':

				this.room.engine = ENGINE_NAMES[packet.ga];
				this.room.mode = GAMEMODE_NAMES[packet.mo];
				
				this.room.gt = packet.gt;
				this.room.rounds = packet.wl;
				this.room.quickplay = packet.q;
				this.room.teamsLocked = packet.tl;
				this.room.teams = packet.tea;
				this.room.framecount = packet.fc;
				this.room.stateID = packet.stateID;
				this.room.admin = packet.admin;
				this.room.map = packet.gs ? packet.gs.map : null;
				this.room.state = packet.state;
				this.room.random = packet.random;

				// apply balances to all the players
				// bal[playerid] = num
				this.players.forEach((player) => {
					player.balance = packet.bal[player.id] || 0;
					this.players.set(player.id, player);
				});
				break;

            case 'PLAYER_JOIN':
                // Add player
                this.players.set(packet.id, {
                    peerID: packet.peerid,
                    guest: packet.guest,
					team: 1,
					teamName: TEAM_NAMES[1],
                    level: parseInt(packet.level),
                    ready: false,
                    tabbed: false,
                    avatar: packet.avatar,
                    id: packet.id,
                    username: packet.username,
					xp: this.levelToXP(packet.level),
					ping: 0,
					balance: 0,
					host: false,
					movement: {
						input: 0,
						frame: 0,
						sequence: 0
					}
                });

				// check if the bot is host
				const botPlayer = this.players.get(this.game.id);
				if (botPlayer.host) {
					this.sendMessage(CLIENT_MESSAGE_TYPES.INFORM_IN_LOBBY, {
						sid: packet.id,
						gs: {
							map: this.room.map || {
								v: 13,
								s: {
									re: false,
									nc: false,
									pq: 1,
									gd: 25,
									fl: false
								},
								physics: {
									shapes: [],
									fixtures: [],
									bodies: [],
									bro: [],
									joints: [],
									ppm: 12
								},
								spawns: [],
								capZones: [],
								m: {
									a: "BonkBot",
									n: "Empty Map",
									dbv: 2,
									dbid: 767645,
									authid: -1,
									date: "",
									rxid: 0,
									rxn: "",
									rxa: "",
									rxdb: 1,
									cr: ["uint32"],
									pub: true,
									mo: ""
								}
							},
							gt: this.room.gt || 2,
							wl: this.room.rounds || 3,
							q: this.room.quickplay || false,
							tl: this.room.teamsLocked || false,
							tea: this.room.teams || false,
							ga: "b",
							mo: "b",
							bal: this.getAllPlayers().reduce((balances, player) => {
								if (player.balance) {
									balances[player.id] = player.balance;
								}
								return balances;
							}, {})
						}
					});
				}

				// Emit join event
				this.events.emit('PLAYER_JOIN', { player: this.players.get(packet.id), id: packet.id });
                break;

            case 'PLAYER_LEAVE':
				const deletedPlayer = this.players.get(packet.id);

                // delete player
                this.players.delete(packet.id);

				// Emit leave event
				this.events.emit('PLAYER_LEAVE', { player: deletedPlayer, id: packet.id });
                break;

            case 'HOST_TRANSFER':
                // Update host
                this.game.host = packet.newHost;

				// find the player that is now host
				this.players.forEach((player) => {
					if (player.id === packet.newHost) {
						player.host = true;
					} else {
						player.host = false;
					}
					this.players.set(player.id, player);
				});

				// Emit host transfer event
				this.events.emit('HOST_TRANSFER', { oldHost: packet.oldHost, newHost: packet.newHost });
                break;

            case 'READY_CHANGE':
                // Update player ready status
                const playerReady = this.players.get(packet.id);

                if (playerReady) {
                    playerReady.ready = packet.ready;

					this.players.set(packet.id, playerReady);
                }

				// Emit ready change event
				this.events.emit('READY_CHANGE', { player: playerReady, ready: packet.ready });
                break;

            case 'TEAMLOCK_TOGGLE':
                // Update teams lock
                this.room.teamsLocked = packet.teamsLocked;

				// Emit teams lock event
				this.events.emit('TEAMLOCK_TOGGLE', { teamsLocked: packet.teamsLocked });
                break;

            case 'PLAYER_TABBED':
                // Update player tabbed status
                const playerTabbed = this.players.get(packet.id);

                if (playerTabbed) {
                    playerTabbed.tabbed = packet.tabbed;

					this.players.set(packet.id, playerTabbed);
                }

				// Emit tabbed event
				this.events.emit('PLAYER_TABBED', { player: playerTabbed, tabbed: packet.tabbed });
                break;

            case 'ROOM_NAME_UPDATE':
                // Update room name
                this.room.name = packet.name;

				// Emit room name change event
				this.events.emit('ROOM_NAME_UPDATE', { name: packet.name });
                break;

			case 'ROOM_ADDRESS':
				// Update room address
				this.room.address = packet.address;

				// Emit room address event
				this.events.emit('ROOM_ADDRESS', { address: packet.address });
				break;

            case 'PLAYER_KICK':
                // Check if we were kicked
                if (packet.id === this.game.id) {
                    this.game.banned = true; // might not act be banned
                }

				// Remove player
				const kickedPlayer = this.players.get(packet.id);
				this.players.delete(packet.id);

				// Emit kick event
				this.events.emit('PLAYER_KICK', kickedPlayer);
                break;

			case 'PLAYER_INPUT':
				// Handle player input
				const playerInput = this.players.get(packet.id);

				if (playerInput) {
					playerInput.movement = {
						input: packet.input,
						frame: packet.frame,
						sequence: packet.sequence
					}

					this.players.set(packet.id, playerInput);
				}

				// Emit player input event
				this.events.emit('PLAYER_INPUT', { player: playerInput, movement: playerInput.movement });
				break;


            default:
                logger.debug(`No handler for packet type: ${packet.type}. Tell the developer about this for a fix!\nhttps://github.com/PixelMelt/BonkBot`, packet);
                break;
        }
    }

    /**
     * Validate account information
     * @private
     * @param {Object} account - Account information
     * @returns {Object} Validated account information
     */
    validateAccount(account) {
        // Default to guest account
        const validatedAccount = {
            guest: true,
            username: `BonkBot-${Math.floor(Math.random() * 10000)}`
        };

        // Override with provided values
        if (account.guest !== undefined) {
            validatedAccount.guest = !!account.guest;
        }

        if (account.username) {
            validatedAccount.username = account.username;
        }

        if (account.password) {
            validatedAccount.password = account.password;
        }

        // Non-guest accounts must have a password
        if (!validatedAccount.guest && !validatedAccount.password) {
            logger.warn('Non-guest account must have a password, defaulting to guest');
            validatedAccount.guest = true;
        }

        return validatedAccount;
    }

    /**
     * Generate a random peer ID
     * @private
     * @returns {string} Random peer ID
     */
    generatePeerId() {
        return Math.random().toString(36).substr(2, 10) + 'v00000';
    }

    /**
     * Get authentication token
     * @private
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<string>} Authentication token
     */
    async getToken(username, password) {
        try {
            logger.info(`Getting token for user: ${username}`);

            const response = await axios.post(API.LOGIN,
                `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&remember=true`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (!response.data || !response.data.token) {
                throw new Error('Failed to get authentication token');
            }

            logger.info('Successfully obtained authentication token');
            return response.data.token;
        } catch (error) {
            logger.error('Failed to authenticate', error);
            throw new Error(`Failed to authenticate: ${error.message}`);
        }
    }

    /**
     * Get server information
     * @private
     * @param {string} [token] - Authentication token
     * @returns {Promise<Object>} Server information
     */
    async getServerInfo(token = '') {
        try {
            const response = await axios.post(API.GET_ROOMS,
                `version=${this.PROTOCOL_VERSION}&gl=y&token=${token}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (!response.data || !response.data.createserver) {
                throw new Error('Failed to get server information');
            }

            return {
                server: response.data.createserver,
                lat: response.data.lat,
                long: response.data.long,
                country: response.data.country
            };
        } catch (error) {
            logger.error('Failed to get server information', error);
            throw new Error(`Failed to get server information: ${error.message}`);
        }
    }

    /**
     * Get list of rooms
     * @private
     * @param {string} [token] - Authentication token
     * @returns {Promise<Array>} List of rooms
     */
    async getRooms(token = '') {
        try {
            logger.info('Getting list of rooms');

            const response = await axios.post(API.GET_ROOMS,
                `version=${this.PROTOCOL_VERSION}&gl=y&token=${token}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (!response.data || !response.data.rooms) {
                throw new Error('Failed to get rooms');
            }

            logger.info(`Retrieved ${response.data.rooms.length} rooms`);
            return response.data.rooms;
        } catch (error) {
            logger.error('Failed to get rooms', error);
            throw new Error(`Failed to get rooms: ${error.message}`);
        }
    }

    /**
     * Get room by name
     * @private
     * @param {string} roomName - Room name
     * @param {string} [token] - Authentication token
     * @returns {Promise<Object|null>} Room object or null if not found
     */
    async getRoomByNam(roomName, token = '') {
        try {
            logger.info(`Searching for room: ${roomName}`);

            const rooms = await this.getRooms(token);

            for (const room of rooms) {
                if (room.roomname === roomName) {
                    logger.info(`Found room: ${roomName}`);
                    return room;
                }
            }

            logger.info(`Room not found: ${roomName}`);
            return null;
        } catch (error) {
            logger.error(`Failed to find room: ${roomName}`, error);
            throw new Error(`Failed to find room: ${error.message}`);
        }
    }

    /**
     * Get room address
     * @private
     * @param {string} id - Room ID
     * @returns {Promise<Object>} Room address
     */
    async getRoomAddress(id) {
        try {
            logger.info(`Getting address for room ID: ${id}`);

            const response = await axios.post(API.GET_ROOM_ADDRESS,
                `id=${id}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (!response.data || !response.data.address) {
                throw new Error('Failed to get room address');
            }

            logger.info(`Retrieved address for room ID: ${id}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to get address for room ID: ${id}`, error);
            throw new Error(`Failed to get room address: ${error.message}`);
        }
    }

    /**
     * Set up socket event handlers
     * @private
     */
    setupSocketEvents() {
        // Register listeners for all message types we care about
        Object.values(SERVER_MESSAGE_TYPES).forEach(eventId => {
            this.socket.on(eventId, (...args) => {
                // Create a packet array with event ID as first element and args as the rest
                const packet = [eventId, ...args];

                // Process the packet
                const parsedPacket = parsePacket(packet);


                // Emit events
                this.events.emit('PACKET', parsedPacket);

                // logger.debug(`Received event ${eventId}`, parsedPacket);
            });
        });

        // Handle standard Socket.IO events
        this.socket.on('connect', () => {
            this.events.emit('connect');
        });

        this.socket.on('disconnect', (reason) => {
            this.events.emit('disconnect', reason);
        });

        this.socket.on('error', (error) => {
            this.events.emit('error', error);
        });
    }


    /**
     * Clean up resources
     * @private
     */
    stopBot() {
        this.connected = false;

        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }


    /**
     * Send a message to the server using Socket.IO v2 protocol
     * @private
     * @param {number} eventId - Event ID from CLIENT_MESSAGE_TYPES
     * @param {any} data - Message data
     */
    sendMessage(eventId, data) {
        this.checkConnection()

        // Double-check that the socket is still connected
        if (!this.socket.connected) {
            this.connected = false;
            throw new Error('Socket disconnected');
        }

		if(eventId != 18 && eventId != 1){
			logger.debug(`Sending message type ${eventId}`, data);
		}

        // For Socket.IO v2, we need to emit to the 'message' event with the event ID and data
        // The server expects a message in the format: [eventId, data]
        this.socket.emit(eventId, data);
    }

    /**
     * Send a timesync message to the server
     * @private
     */
    sendTimesync() {
        this.sendMessage(CLIENT_MESSAGE_TYPES.TIMESYNC, {
            jsonrpc: "2.0",
            id: this.timeSync.count++,
            method: "timesync"
        });
    }

    /**
     * Check if connected to server
     * @private
     * @throws {Error} If not connected
     */
    checkConnection() {
        if (!this.connected || !this.socket) {
            throw new Error('Not connected to server');
        }
    }

    /**
     * Converts level to XP total
     * @param {Number} level - The level to convert
     * @returns {Number} The total XP required for this level
     */
    levelToXP(level) {
        if (level < 1) return 0;
        return 100 * Math.pow(level - 1, 2);
    }

    /**
     * Converts XP total to level
     * @param {Number} xp - The XP amount to convert
     * @returns {Number} The level for this XP amount
     */
    xpToLevel(xp) {
        if (xp < 0) return 1;
        return Math.floor(Math.sqrt(xp / 100) + 1);
    }
}

module.exports = BonkBot;