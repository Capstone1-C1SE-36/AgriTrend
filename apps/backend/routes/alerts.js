import express from "express"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

const alerts = []

// Get user alerts
router.get("/", authenticateToken, (req, res) => {
  const userAlerts = alerts.filter((a) => a.userId === req.user.id)
  res.json(userAlerts)
})

// Create alert
router.post("/", authenticateToken, (req, res) => {
  const newAlert = {
    id: alerts.length + 1,
    userId: req.user.id,
    ...req.body,
    createdAt: new Date().toISOString(),
  }

  alerts.push(newAlert)
  res.status(201).json(newAlert)
})

// Update alert
router.put("/:id", authenticateToken, (req, res) => {
  const index = alerts.findIndex((a) => a.id === Number.parseInt(req.params.id) && a.userId === req.user.id)

  if (index === -1) {
    return res.status(404).json({ error: "Alert not found" })
  }

  alerts[index] = { ...alerts[index], ...req.body }
  res.json(alerts[index])
})

// Delete alert
router.delete("/:id", authenticateToken, (req, res) => {
  const index = alerts.findIndex((a) => a.id === Number.parseInt(req.params.id) && a.userId === req.user.id)

  if (index === -1) {
    return res.status(404).json({ error: "Alert not found" })
  }

  alerts.splice(index, 1)
  res.json({ message: "Alert deleted successfully" })
})

export default router
