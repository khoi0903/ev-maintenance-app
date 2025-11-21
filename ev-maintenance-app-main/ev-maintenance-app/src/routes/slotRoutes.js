const router = require("express").Router();
const { auth } = require("../middlewares/authMiddleware");
const { role } = require("../middlewares/roleMiddleware");
const allow = (...roles) => [auth, role(...roles)];
const slotController = require("../controllers/slotController");

// GET /api/slots/free?date=YYYY-MM-DD
router.get("/free", allow("Customer","Admin","Staff","Technician"), slotController.freeByDate);

// CRUD routes for Staff/Admin
router.get("/", allow("Admin","Staff"), slotController.listAll);
router.get("/:id", allow("Admin","Staff"), slotController.getById);
router.post("/", allow("Admin","Staff"), slotController.create);
router.put("/:id", allow("Admin","Staff"), slotController.update);
router.delete("/:id", allow("Admin","Staff"), slotController.delete);

module.exports = router;
