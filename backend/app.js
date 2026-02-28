const express = require("express");
const cors = require("cors");
const queryRoutes = require("./routes/query.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const authRoutes = require("./routes/auth.routes");
const logger = require("./utils/logger");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/query", queryRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
