const shortid = require("shortid");
const URL = require("../models/url");

async function handleGenerateNewShortURL(req, res) {
  const { url, validity, shortcode } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required." });

  const validUrlPattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/gm;
  if (!validUrlPattern.test(url)) return res.status(400).json({ error: "Invalid URL format." });

  const validityMinutes = validity ? parseInt(validity) : 30;
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  let shortId = shortcode || shortid.generate();

  // Ensure shortcode is unique
  const existing = await URL.findOne({ shortId });
  if (existing) {
    return res.status(400).json({ error: "Shortcode already in use." });
  }

  await URL.create({
    shortId,
    redirectUrl: url,
    visitHistory: [],
    expiresAt,
  });

  return res.status(201).json({
    shortLink: `https://hostname:port/${shortId}`,
    expiry: expiresAt.toISOString(),
  });
}

async function handleGetAnalytics(req, res) {
  const { shortId } = req.params;

  const urlEntry = await URL.findOne({ shortId });
  if (!urlEntry) return res.status(404).json({ error: "Shortcode not found." });

  return res.status(200).json({
    shortLink: `https://hostname:port/${shortId}`,
    originalURL: urlEntry.redirectUrl,
    createdAt: urlEntry.createdAt,
    expiry: urlEntry.expiresAt,
    totalClicks: urlEntry.visitHistory.length,
    analytics: urlEntry.visitHistory,
  });
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetAnalytics,
};

