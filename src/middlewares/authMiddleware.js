import jwt from "jsonwebtoken";
import { User, Officer } from "../models/index.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token, unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecret");

    // Token is generated with userId, so check for userId, id, or _id for compatibility
    const userId = decoded.userId || decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Check both User and Officer models since admins log in as Officers
    let user = await User.findById(userId);
    let officer = null;
    
    // If not found in User, check Officer (for admin/officer logins)
    if (!user) {
      officer = await Officer.findById(userId);
      if (!officer) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    // Set req.user based on which model was found
    if (user) {
      // Regular user - User model doesn't have role field, default to "user"
      req.user = { id: user._id.toString(), role: "user" };
    } else if (officer) {
      // Admin/Officer - use the role from Officer model (can be "admin" or "OFFICER")
      // Normalize role to lowercase for consistency
      const role = officer.role?.toLowerCase() || "officer";
      req.user = { id: officer._id.toString(), role };
    }
    
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// Usage: authorizeRoles("admin", "user")
export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
