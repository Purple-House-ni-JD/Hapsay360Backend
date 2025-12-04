import Blotter from "../models/Blotter.js";
import User from "../models/User.js";

/**
 * @route POST /api/blotters
 * create a new blotter
 * */
export const createBlotter = async (req, res) => {
  try {
    const {
      userId,
      incidentType,
      incidentDate,
      incidentTime,
      incidentDescription,
      latitude,
      longitude,
      address,
      reporterName,
      reporterContact,
      reporterAddress,
      officerId,
      attachments, // <--- 1. Get attachments from the request
    } = req.body;

    // Validate
    if (!userId || !incidentType || !reporterName) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Create Blotter
    const blotter = new Blotter({
      user_id: userId,
      assigned_Officer: officerId,

      incident: {
        type: incidentType,
        date: incidentDate,
        time: incidentTime,
        description: incidentDescription,
        location: { latitude, longitude, address },
      },

      reporter: {
        fullName: reporterName,
        contactNumber: reporterContact,
        address: reporterAddress,
      },

      // 2. SAVE THE ATTACHMENTS HERE
      // We use || [] to ensure it doesn't crash if attachments is undefined
      attachments: attachments || [],
    });

    await blotter.save();
    res.status(201).json({ success: true, data: blotter });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route GET /api/blotters
 * Get all blotters using async/wait function
 * */
export const getAllBlotters = async (req, res) => {
  try {
    const blotters = await Blotter.find()
      .populate("user_id", "-password")
      .populate("assigned_Officer", "-password");
    res.status(200).json({
      success: true,
      count: blotters.length,
      data: blotters,
    });
  } catch (error) {
    console.error("Error fetching blotters:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ... existing imports and functions

/**
 * @route GET /api/blotters/user/:userId
 * Get blotters specific to a user
 */
// controllers/blotter.controller.js

export const getUserBlotters = async (req, res) => {
  try {
    const { userId } = req.params;

    // CHANGED: Query using user_id only (No more $or needed)
    const blotters = await Blotter.find({ user_id: userId })
      .populate("assigned_Officer", "first_name last_name")
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: blotters.length,
      blotters: blotters,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
