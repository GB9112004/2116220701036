const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/request.log");

function loggingMiddleware(req, res, next) {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`;

  fs.appendFile(logFile, log, (err) => {
    if (err) console.error("Logging failed:", err);
  });

  next();
}

module.exports = loggingMiddleware;
