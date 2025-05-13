/**
 * Simple logger module for the application
 */

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set current log level (can be changed based on environment)
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

/**
 * Format the current date and time for log messages
 * @returns {string} Formatted date and time
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Log an error message
 * @param {string} message - The error message to log
 */
const error = (message) => {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(`[ERROR] ${getTimestamp()} - ${message}`);
  }
};

/**
 * Log a warning message
 * @param {string} message - The warning message to log
 */
const warn = (message) => {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(`[WARN] ${getTimestamp()} - ${message}`);
  }
};

/**
 * Log an info message
 * @param {string} message - The info message to log
 */
const info = (message) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`[INFO] ${getTimestamp()} - ${message}`);
  }
};

/**
 * Log a debug message
 * @param {string} message - The debug message to log
 */
const debug = (message) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(`[DEBUG] ${getTimestamp()} - ${message}`);
  }
};

module.exports = {
  error,
  warn,
  info,
  debug
};
