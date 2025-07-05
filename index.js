const express = require('express');
const path = require('path');
const { connectToMongoDB } = require('./connect');
const staticRoute = require("./routes/staticRouter");
const urlRoute = require("./routes/url");
const URL = require("./models/url");
const loggingMiddleware = require("./middleware/logger");

const app = express();
const PORT = 8002;

// View engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(loggingMiddleware); // ✅ Mandatory logging

// Routes
app.use("/url", urlRoute);
app.use("/", staticRoute);

// Redirect Route with Expiry Check
app.get("/url/:shortId", async (req, res) => {
  const { shortId } = req.params;
  const entry = await URL.findOne({ shortId });

  if (!entry) {
    return res.status(404).json({ error: "Shortcode not found." });
  }

  const currentTime = new Date();
  if (entry.expiresAt < currentTime) {
    return res.status(410).json({ error: "Shortlink has expired." });
  }

  // Track visit
  entry.visitHistory.push({ timestamp: new Date() });
  await entry.save();

  res.redirect(entry.redirectUrl);
});

// MongoDB Connect and Start Server
connectToMongoDB('mongodb://localhost:27017/short-url')
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server is started at PORT:${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

