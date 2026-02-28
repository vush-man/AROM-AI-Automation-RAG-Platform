const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const timestampLog = (message) => {
  return `[${new Date().toISOString()}] ${message}`;
};

const logger = {
  info: (message) => {
    const logMessage = timestampLog(`INFO: ${message}`);
    console.log(logMessage);
    fs.appendFileSync(path.join(logDir, "info.log"), logMessage + "\n");
  },

  error: (message, error = null) => {
    const errorStack = error ? `\n${error.stack}` : "";
    const logMessage = timestampLog(`ERROR: ${message}${errorStack}`);
    console.error(logMessage);
    fs.appendFileSync(path.join(logDir, "error.log"), logMessage + "\n");
  },

  warn: (message) => {
    const logMessage = timestampLog(`WARN: ${message}`);
    console.warn(logMessage);
    fs.appendFileSync(path.join(logDir, "warn.log"), logMessage + "\n");
  },

  debug: (message) => {
    const logMessage = timestampLog(`DEBUG: ${message}`);
    if (process.env.DEBUG) {
      console.log(logMessage);
    }
    fs.appendFileSync(path.join(logDir, "debug.log"), logMessage + "\n");
  },
};

module.exports = logger;
