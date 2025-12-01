import express from "express";
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  getAllAppointments,
} from "../controllers/appointment.controller.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// User Routes
router.post("/", authMiddleware, authorizeRoles("user"), createAppointment);

router.get(
  "/my-appointments",
  authMiddleware,
  authorizeRoles("user"),
  getMyAppointments
);

router.get(
  "/:appointmentId",
  authMiddleware,
  authorizeRoles("user"),
  getAppointmentById
);

router.put(
  "/:appointmentId",
  authMiddleware,
  authorizeRoles("user"),
  updateAppointment
);

router.patch(
  "/:appointmentId/cancel",
  authMiddleware,
  authorizeRoles("user"),
  cancelAppointment
);

router.delete(
  "/:appointmentId",
  authMiddleware,
  authorizeRoles("user"),
  deleteAppointment
);

// Admin Routes
router.get(
  "/admin/all",
  authMiddleware,
  authorizeRoles("admin"),
  getAllAppointments
);

export default router;
