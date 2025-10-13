require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/auth", require("./routes/authRoutes"));
app.use("/account", require("./routes/accountRoutes"));
app.use("/vehicle", require("./routes/vehicleRoutes"));
app.use("/appointment", require("./routes/appointmentRoutes"));
app.use("/workorder", require("./routes/workOrderRoutes"));
app.use("/invoice", require("./routes/invoiceRoutes"));
app.use("/payment", require("./routes/paymentRoutes"));
app.use("/reminder", require("./routes/reminderRoutes"));
app.use("/report", require("./routes/reportRoutes"));
app.use("/service", require("./routes/serviceCatalogRoutes"));

app.get("/", (req, res) => res.send("🚗 EV Service Center API is running..."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
