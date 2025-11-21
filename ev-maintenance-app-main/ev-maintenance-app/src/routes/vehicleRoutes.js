const router = require("express").Router();
const vehicleController = require("../controllers/vehicleController");
const { auth } = require("../middlewares/authMiddleware");
const { role } = require("../middlewares/roleMiddleware");
const allow = (...roles) => [auth, role(...roles)];

// Customer xem xe của chính mình

router.get("/", allow("Customer","Admin","Staff","Technician"), vehicleController.getAllByAccount);
// CRUD
router.post("/", allow("Customer","Admin","Staff","Technician"), vehicleController.create);
router.put("/:id", allow("Customer","Admin","Staff","Technician"), vehicleController.update);
router.delete("/:id", allow("Customer","Admin","Staff","Technician"), vehicleController.remove);
// thêm dòng dưới các route khác
router.get("/by-vin", allow("Customer","Admin","Staff","Technician"), vehicleController.getByVin);

module.exports = router;
