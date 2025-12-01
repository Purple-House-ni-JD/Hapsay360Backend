import { User, ClearanceApplication } from "../models/index.js";

/**
 * Create a new clearance application
 * @route POST /api/clearance/create
 * Accessible only to 'user'
 */
export const createClearance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const { purpose, policeStation, appointmentDate, timeSlot } = req.body;

    if (!purpose)
      return res
        .status(400)
        .json({ success: false, message: "Purpose is required" });

    const clearance = new ClearanceApplication({
      user_id: user._id,
      purpose,
      status: "pending",
      station_id: policeStation || undefined,
      appointment_date: appointmentDate ? new Date(appointmentDate) : undefined,
      time_slot: timeSlot || undefined,
    });

    await clearance.save();

    // Clean response if needed
    const response = clearance.toObject();
    delete response.__v;

    res.status(201).json({
      success: true,
      message: "Clearance application created successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error creating clearance:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get all clearances for a user
 * @route GET /api/clearance/my-clearances
 */
export const getMyClearances = async (req, res) => {
  try {
    const clearances = await ClearanceApplication.find({
      user_id: req.user.id,
    }).populate("station_id");

    // Map to clean response
    const cleaned = clearances.map((c) => {
      const obj = c.toObject();
      delete obj.__v;
      return obj;
    });

    res
      .status(200)
      .json({ success: true, count: cleaned.length, data: cleaned });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get all clearances (admin only)
 * @route GET /api/clearance
 */
export const getAllClearances = async (req, res) => {
  try {
    const clearances = await ClearanceApplication.find()
      .populate("user_id", "-password")
      .populate("station_id");

    // Map to clean response
    const cleaned = clearances.map((c) => {
      const obj = c.toObject();
      delete obj.__v;
      return obj;
    });

    res
      .status(200)
      .json({ success: true, count: cleaned.length, data: cleaned });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateClearance = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ safe access
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, paymentStatus, payment } = req.body;

    const clearance = await ClearanceApplication.findById(id);
    if (!clearance) {
      return res
        .status(404)
        .json({ success: false, message: "Clearance not found" });
    }

    // Only the owner or admin can update
    if (clearance.user_id.toString() !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden: cannot update this clearance",
        });
    }

    // Update fields
    if (status) clearance.status = status;
    if (paymentStatus) {
      clearance.payment = {
        ...clearance.payment,
        status: paymentStatus,
        ...payment,
      };
    }

    await clearance.save();

    const response = clearance.toObject();
    delete response.__v;

    res
      .status(200)
      .json({ success: true, message: "Clearance updated", data: response });
  } catch (error) {
    console.error("Error updating clearance:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
