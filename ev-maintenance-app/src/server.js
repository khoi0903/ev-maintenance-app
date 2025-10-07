require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/account", require("./routes/accountRoutes"));
app.use("/vehicle", require("./routes/vehicleRoutes"));
app.use("/appointment", require("./routes/appointmentRoutes"));

// Root test
app.get("/", (req, res) => {
  res.send("🚗 EV Service Center API is running...");
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
