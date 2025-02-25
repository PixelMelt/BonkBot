/**
 * Validation utilities for BonkBot
 */

/**
 * Validates account configuration
 * @param {Object} account - Account configuration object
 * @returns {Object} Validated account object with defaults applied
 * @throws {Error} If required fields are missing
 */
function validateAccount(account = {}) {
  // Clone to avoid modifying the original
  const validatedAccount = { ...account };

  // Set default guest status if not provided
  if (validatedAccount.guest === undefined) {
    validatedAccount.guest = true;
  }

  // If not a guest, username and password are required
  if (!validatedAccount.guest) {
    if (!validatedAccount.username) {
      throw new Error("Username is required for non-guest accounts");
    }
    if (!validatedAccount.password) {
      throw new Error("Password is required for non-guest accounts");
    }
  } else {
    // For guests, generate a random username if not provided
    if (!validatedAccount.username) {
      validatedAccount.username = `BonkBot-${Math.random()
        .toString()
        .substr(2, 5)}`;
    }
  }

  return validatedAccount;
}

/**
 * Validates room configuration
 * @param {Object} options - Room configuration options
 * @returns {Object} Validated room options with defaults applied
 */
function validateRoomOptions(options = {}) {
  return {
    roomname:
      options.roomname ||
      `BonkBot Room ${Math.random().toString().substr(2, 5)}`,
    maxplayers: options.maxplayers || 8,
    roompassword: options.roompassword || "",
    basecolor: options.basecolor !== undefined ? options.basecolor : 0,
    skin: options.skin,
    peerid: options.peerid || generatePeerID(),
  };
}

/**
 * Validates join room options
 * @param {Object} options - Join room options
 * @throws {Error} If required fields are missing
 * @returns {Object} Validated join options
 */
function validateJoinOptions(options = {}) {
  if (!options.address) {
    throw new Error("Room address is required to join a room");
  }

  return {
    address: options.address,
    roompassword: options.roompassword || "",
    basecolor: options.basecolor !== undefined ? options.basecolor : 16448250,
    skin: options.skin,
    peerid: options.peerid || generatePeerID(),
  };
}

/**
 * Generates a random peer ID
 * @returns {string} Random peer ID
 */
function generatePeerID() {
  return Math.random().toString(36).substr(2, 10) + "v00000";
}

/**
 * Validates that a value is a non-empty string
 * @param {any} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @throws {Error} If validation fails
 */
function validateString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Validates that a value is a number
 * @param {any} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @throws {Error} If validation fails
 */
function validateNumber(value, name) {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${name} must be a number`);
  }
}

/**
 * Validates that a value is a boolean
 * @param {any} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @throws {Error} If validation fails
 */
function validateBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean`);
  }
}

module.exports = {
  validateAccount,
  validateRoomOptions,
  validateJoinOptions,
  validateString,
  validateNumber,
  validateBoolean,
  generatePeerID,
};
