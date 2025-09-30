require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const authController = require("./controllers/authController");
const authMiddleware = require("./middlewares/authMiddleware");
const roleMiddleware = require("./middlewares/roleMiddleware");
const vehicleController = require("./controllers/vehicleController");
const appointmentController = require("./controllers/appointmentController");

const app = express();
app.use(bodyParser.json());

// === Auth ===
app.post("/auth/register", (req, res) => authController.registerCustomer(req, res));
app.post("/auth/login", (req, res) => authController.login(req, res));
app.post(
  "/auth/admin-create",
  authMiddleware,
  roleMiddleware(["Admin"]),
  (req, res) => authController.createAccountByAdmin(req, res)
);

// === Vehicle ===
app.post("/vehicles", authMiddleware, (req, res) => vehicleController.createVehicle(req, res));
app.get("/vehicles/my", authMiddleware, (req, res) => vehicleController.getMyVehicles(req, res));
app.put("/vehicles/:id", authMiddleware, (req, res) => vehicleController.updateVehicle(req, res));
app.put("/vehicles/:id/deactivate", authMiddleware, (req, res) =>
  vehicleController.deactivateVehicle(req, res)
);

// === Appointment ===
app.post("/appointments", authMiddleware, (req, res) =>
  appointmentController.createAppointment(req, res)
);
app.get("/appointments/my", authMiddleware, (req, res) =>
  appointmentController.getMyAppointments(req, res)
);
app.put(
  "/appointments/:id/confirm",
  authMiddleware,
  roleMiddleware(["Staff"]),
  (req, res) => appointmentController.confirmAppointment(req, res)
);
app.put("/appointments/:id/cancel", authMiddleware, (req, res) =>
  appointmentController.cancelAppointment(req, res)
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
