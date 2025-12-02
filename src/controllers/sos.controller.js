import SOSRequest from "../models/SOSRequest.js"; // Make sure path matches your model file

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
