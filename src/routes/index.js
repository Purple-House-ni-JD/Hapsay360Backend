import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./users.routes.js";
import clearanceRoutes from "./clearance.routes.js";
import policeStationRoutes from "./policeStation.routes.js";
import blotterRoutes from "./blotter.routes.js";
import applicationRoutes from "./application.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import sosRoutes from "./sos.routes.js";

const router = express.Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/clearance", clearanceRoutes);
router.use("/police-stations", policeStationRoutes);
router.use("/blotters", blotterRoutes);
router.use("/application", applicationRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/sos", sosRoutes);

export default router;
