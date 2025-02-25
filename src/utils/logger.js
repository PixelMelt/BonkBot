/**
 * Logger utility for BonkBot
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

/**
* Logger class for consistent logging throughout the library
*/
class Logger {
  /**
   * Create a new logger
   * @param {string} name - Name of the logger (typically the module name)
   * @param {number} level - Minimum log level to display (defaults to WARN)
   */
  constructor(name, level = LOG_LEVELS.WARN) {
      this.name = name;
      this.level = level;
  }

  /**
   * Set the log level
   * @param {number} level - New log level
   */
  setLevel(level) {
      this.level = level;
  }

  /**
   * Format a log message
   * @param {string} level - Log level name
   * @param {string} message - Log message
   * @returns {string} Formatted log message
   * @private
   */
  _format(level, message) {
      return `[${level}] [${this.name}] ${message}`;
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {any} [data] - Optional data to include
   */
  debug(message, data) {
      if (this.level <= LOG_LEVELS.DEBUG) {
          const formattedMessage = this._format("DEBUG", message);
          console.debug(formattedMessage, data !== undefined ? data : "");
      }
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {any} [data] - Optional data to include
   */
  info(message, data) {
      if (this.level <= LOG_LEVELS.INFO) {
          const formattedMessage = this._format("INFO", message);
          console.info(formattedMessage, data !== undefined ? data : "");
      }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {any} [data] - Optional data to include
   */
  warn(message, data) {
      if (this.level <= LOG_LEVELS.WARN) {
          const formattedMessage = this._format("WARN", message);
          console.warn(formattedMessage, data !== undefined ? data : "");
      }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error|any} [error] - Optional error or data to include
   */
  error(message, error) {
      if (this.level <= LOG_LEVELS.ERROR) {
          const formattedMessage = this._format("ERROR", message);
          console.error(formattedMessage, error !== undefined ? error : "");
      }
  }
}

/**
* Create a new logger instance
* @param {string} name - Name of the logger
* @param {number} level - Minimum log level
* @returns {Logger} New logger instance
*/
function createLogger(name, level = LOG_LEVELS.INFO) {
  return new Logger(name, level);
}

module.exports = {
  LOG_LEVELS,
  createLogger,
};