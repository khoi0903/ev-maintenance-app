// src/routes/workOrderRoutes.js
const express = require("express")
const router = express.Router()
const c = require("../controllers/workOrderController")
const { auth } = require("../middlewares/authMiddleware")
const { role } = require("../middlewares/roleMiddleware")

const allow = (...roles) => [auth, role(...roles)]

// ==== CUSTOMER & TECHNICIAN - my work orders ====
router.get("/my/active", auth, c.getMyActive)
router.get("/my/completed", auth, c.getMyCompleted)
router.get("/my/:id", auth, c.getMyWorkOrder)

// Technician actions on his own work orders
router.post("/my/:id/start", auth, role("Technician"), c.startMyWork)
router.post("/my/:id/complete", auth, role("Technician"), c.completeMyWork)
router.patch("/my/:id/diagnosis", auth, role("Technician"), c.updateMyDiagnosis)
router.post("/my/:id/parts", auth, role("Technician"), c.addPartForMyWork)
router.delete('/my/parts/:usageId', auth, role('Technician'), c.deleteMyPartUsage)

// ==== STAFF / ADMIN ====
router.get("/", allow("Staff", "Admin"), c.listAll)
router.post("/", allow("Staff", "Admin"), c.create)
router.get("/:id", allow("Staff", "Admin"), c.getOne)
router.post("/:id/details", allow("Staff", "Admin","Technician"), c.addServiceDetail)
router.delete("/details/:detailId", allow("Staff", "Admin","Technician"), c.deleteServiceDetail)
router.post("/:id/parts", allow("Staff", "Admin","Technician"), c.addPartUsage)
router.delete('/parts/:usageId', allow('Staff','Admin','Technician'), c.deletePartUsage)
router.patch("/:id", allow("Staff", "Admin","Technician"), c.update)
router.post('/workorders/my/:id/complete', allow("Staff", "Admin", "Technician"), c.completeMyWork)

module.exports = router
