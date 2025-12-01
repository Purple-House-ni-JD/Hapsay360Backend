import express from "express";
import { register, login, registerAdmin, loginAdmin } from "../controllers/auth.controller.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ---------- Public Routes ----------
router.post("/register", register);
router.post(
  "/admin/register",
  (req, res, next) => {
    req.body.role = "admin";
    next();
  },
  register
);
router.post(
  "/officer/register",
  (req, res, next) => {
    req.body.role = "officer";
    next();
  },
  register
);
router.post("/login", login);

router.post("/admin/login", loginAdmin);

// ---------- Protected Test Routes ----------
router.get("/admin-only", authMiddleware, authorizeRoles("admin"), (req, res) =>
  res.json({ message: "Hello Admin!" })
);
router.get("/user-only", authMiddleware, authorizeRoles("user"), (req, res) =>
  res.json({ message: "Hello User!" })
);
router.get(
  "/officer-only",
  authMiddleware,
  authorizeRoles("officer"),
  (req, res) => res.json({ message: "Hello Officer!" })
);

export default router;
