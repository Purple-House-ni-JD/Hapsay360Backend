import SOSRequest from "../models/SOSRequest.js";

// Create SOS
export const createSOS = async (req, res) => {
  try {
    const { user_id, nearest_station_id, latitude, longitude } = req.body;

    // Validation
    if (!user_id || !nearest_station_id || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (User ID, Station ID, or Location)",
      });
    }

    // Create the SOS entry
    const newSOS = new SOSRequest({
      user_id,
      nearest_station_id,
      location: {
        latitude,
        longitude,
      },
      status: "pending",
    });

    await newSOS.save();

    res.status(201).json({
      success: true,
      message: "SOS Alert Created",
      data: newSOS,
    });
  } catch (error) {
    console.error("SOS Creation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Fetch all SOS requests
export const getAllSOS = async (req, res) => {
  try {
    const sosRequests = await SOSRequest.find()
      .populate("user_id", "name personal_info phone_number custom_id")
      .populate("nearest_station_id", "name address contact custom_id")
      .populate("responder_station_id", "name address contact custom_id")
      .sort({ created_at: -1 }); // Most recent first

    const data = sosRequests.map((sos) => ({
      _id: sos._id,
      id: sos.custom_id,
      caller: sos.user_id?.personal_info
        ? `${sos.user_id.personal_info.given_name} ${sos.user_id.personal_info.surname}`
        : sos.user_id?.name || "Unknown",
      timestamp: sos.created_at,
      lat: sos.location.latitude,
      lng: sos.location.longitude,
      status: sos.status.toUpperCase(),
      responder: sos.responder_station_id?.name || "Not yet assigned",
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Fetch SOS Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Fetch single SOS request by ID
export const getSOSById = async (req, res) => {
  try {
    const { id } = req.params;

    const sosRequest = await SOSRequest.findById(id)
      .populate("user_id", "name personal_info phone_number email custom_id")
      .populate("nearest_station_id", "name address contact location custom_id")
      .populate(
        "responder_station_id",
        "name address contact location custom_id"
      );

    if (!sosRequest) {
      return res.status(404).json({
        success: false,
        message: "SOS request not found",
      });
    }

    res.json({
      success: true,
      data: sosRequest,
    });
  } catch (error) {
    console.error("Fetch SOS by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update SOS request
export const updateSOS = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responder_station_id } = req.body;

    const updateData = {};

    if (status) {
      updateData.status = status.toLowerCase();
    }

    if (responder_station_id !== undefined) {
      updateData.responder_station_id = responder_station_id || null;
    }

    const updatedSOS = await SOSRequest.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("user_id", "name personal_info phone_number custom_id")
      .populate("nearest_station_id", "name address contact custom_id")
      .populate("responder_station_id", "name address contact custom_id");

    if (!updatedSOS) {
      return res.status(404).json({
        success: false,
        message: "SOS request not found",
      });
    }

    res.json({
      success: true,
      message: "SOS request updated successfully",
      data: updatedSOS,
    });
  } catch (error) {
    console.error("Update SOS Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete SOS request
export const deleteSOS = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSOS = await SOSRequest.findByIdAndDelete(id);

    if (!deletedSOS) {
      return res.status(404).json({
        success: false,
        message: "SOS request not found",
      });
    }

    res.json({
      success: true,
      message: "SOS request deleted successfully",
    });
  } catch (error) {
    console.error("Delete SOS Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
