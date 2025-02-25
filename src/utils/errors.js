/**
 * Custom error classes for BonkBot
 */

/**
 * Base error class for BonkBot errors
 */
class BonkBotError extends Error {
	/**
	 * Create a new BonkBotError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message);
		this.name = this.constructor.name;
		this.code = options.code || "UNKNOWN_ERROR";
		this.details = options.details || {};

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

/**
 * Error thrown when there's a connection issue
 */
class ConnectionError extends BonkBotError {
	/**
	 * Create a new ConnectionError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "CONNECTION_ERROR",
			details: options.details,
		});
	}
}

/**
 * Error thrown when there's an authentication issue
 */
class AuthenticationError extends BonkBotError {
	/**
	 * Create a new AuthenticationError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "AUTHENTICATION_ERROR",
			details: options.details,
		});
	}
}

/**
 * Error thrown when there's an issue with room operations
 */
class RoomError extends BonkBotError {
	/**
	 * Create a new RoomError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "ROOM_ERROR",
			details: options.details,
		});
	}
}

/**
 * Error thrown when there's an issue with the game state
 */
class GameStateError extends BonkBotError {
	/**
	 * Create a new GameStateError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "GAME_STATE_ERROR",
			details: options.details,
		});
	}
}

/**
 * Error thrown when there's a validation issue
 */
class ValidationError extends BonkBotError {
	/**
	 * Create a new ValidationError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "VALIDATION_ERROR",
			details: options.details,
		});
	}
}

/**
 * Error thrown when a rate limit is hit
 */
class RateLimitError extends BonkBotError {
	/**
	 * Create a new RateLimitError
	 * @param {string} message - Error message
	 * @param {Object} [options] - Additional error options
	 */
	constructor(message, options = {}) {
		super(message, {
			code: options.code || "RATE_LIMIT_ERROR",
			details: options.details,
		});
	}
}

module.exports = {
	BonkBotError,
	ConnectionError,
	AuthenticationError,
	RoomError,
	GameStateError,
	ValidationError,
	RateLimitError,
};