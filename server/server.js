const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");
const startExpiryScheduler = require("./jobs/expiryScheduler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const identityRoutes = require("./routes/identityRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const userRoutes = require("./routes/userRoutes");
const accessLogRoutes = require("./routes/accessLogRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/identity", identityRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", accessLogRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Wait for DB connection then start server
connectDB().then(() => {
  startExpiryScheduler();
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });
});

module.exports = app;
