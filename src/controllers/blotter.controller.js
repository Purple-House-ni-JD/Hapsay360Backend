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
      officerId,
    } = req.body;

    if (
      !userId ||
      !incidentType ||
      !incidentDate ||
      !incidentTime ||
      !incidentDescription
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const officer = await Officer.findById(officerId);
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    const incident = {
      incident_type: incidentType,
      date: incidentDate,
      time: incidentTime,
      description: incidentDescription,
    };

    const blotter = new Blotter({
      user_id: userId,
      assigned_officer: officerId,
      incident,
    });

    await blotter.save();
    res.status(201).json({
      success: true,
      data: blotter,
    });
  } catch (error) {
    console.error("Error creating blotter:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
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
      .populate("assigned_officer", "-password");
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

    // SOLUTION: Look for user_id OR userId
    const blotters = await Blotter.find({
      $or: [
        { user_id: userId }, // Matches your new schema
        { userId: userId }, // Matches your existing test data
      ],
    })
      .populate("assigned_officer", "first_name last_name") // Adjusted based on your officer model
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: blotters.length,
      blotters: blotters,
    });
  } catch (error) {
    console.error("Error fetching user blotters:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
