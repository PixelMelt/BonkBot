/**
 * BonkBot - A JavaScript library for creating bots for bonk.io
 * @module bonkbot
 */
const BonkBot = require("./bot");
const {
    LOG_LEVELS
} = require("./utils/logger");

/**
 * Create a new BonkBot instance
 * @param {Object} options - Bot options
 * @returns {BonkBot} New BonkBot instance
 */
function createBot(options = {}) {
    return new BonkBot(options);
}

module.exports = {
    createBot,
    LOG_LEVELS,
    BonkBot,
};