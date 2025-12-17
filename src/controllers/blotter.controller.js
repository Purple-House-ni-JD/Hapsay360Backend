import Blotter from "../models/Blotter.js";
import User from "../models/User.js";
import Officer from "../models/Officer.js";

/**
 * @route POST /api/blotters
 * create a new blotter
 */
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
      attachments,
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

    // Convert attachments from base64 to Buffer (like announcements)
    let attachmentArray = [];
    if (attachments && Array.isArray(attachments)) {
      attachmentArray = attachments.map((att) => {
        // If it's base64 data, convert to Buffer
        if (att.data && typeof att.data === "string") {
          // Extract base64 data from data URL (data:image/png;base64,...)
          const base64Data = att.data.includes(",")
            ? att.data.split(",")[1]
            : att.data;
          const buffer = Buffer.from(base64Data, "base64");

          return {
            filename: att.filename || att.name || "attachment",
            mimetype: att.mimetype || att.type || "application/octet-stream",
            data: buffer,
            size: buffer.length,
          };
        }
        // If it already has a buffer, keep as is
        return att;
      });
    }

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

      attachments: attachmentArray,
    });

    await blotter.save();

    // Convert binary data to URLs in response (like announcements)
    const responseData = blotter.toObject();
    if (responseData.attachments) {
      responseData.attachments = responseData.attachments.map((att, index) => ({
        filename: att.filename,
        mimetype: att.mimetype,
        size: att.size,
        url: `/api/blotters/${blotter._id}/attachments/${index}`,
      }));
    }

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route GET /api/blotters
 * Get all blotters
 */
export const getAllBlotters = async (req, res) => {
  try {
    const blotters = await Blotter.find()
      .populate("user_id", "personal_info email phone_number profile_picture")
      .populate("assigned_Officer", "first_name last_name")
      .sort({ created_at: -1 });

    // Convert binary data to URLs in response (like announcements)
    const blottersWithUrls = blotters.map((blotter) => {
      const blotterObj = blotter.toObject();
      if (blotterObj.attachments && blotterObj.attachments.length > 0) {
        blotterObj.attachments = blotterObj.attachments.map((att, index) => ({
          filename: att.filename,
          mimetype: att.mimetype,
          size: att.size,
          url: `/api/blotters/${blotter._id}/attachments/${index}`,
        }));
      }
      return blotterObj;
    });

    res.status(200).json({
      success: true,
      count: blottersWithUrls.length,
      data: blottersWithUrls,
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

/**
 * @route GET /api/blotters/user/:userId
 * Get blotters specific to a user
 */
export const getUserBlotters = async (req, res) => {
  try {
    const { userId } = req.params;

    const blotters = await Blotter.find({ user_id: userId })
      .populate("user_id", "personal_info email phone_number profile_picture")
      .populate("assigned_Officer", "first_name last_name")
      .sort({ created_at: -1 });

    // --- FIX STARTS HERE ---
    // Convert binary data to URLs so the app can display them
    const blottersWithUrls = blotters.map((blotter) => {
      const blotterObj = blotter.toObject();
      if (blotterObj.attachments && blotterObj.attachments.length > 0) {
        blotterObj.attachments = blotterObj.attachments.map((att, index) => ({
          filename: att.filename,
          mimetype: att.mimetype,
          size: att.size,
          // Create the URL endpoint for the image
          url: `/api/blotters/${blotter._id}/attachments/${index}`,
        }));
      }
      return blotterObj;
    });
    // --- FIX ENDS HERE ---

    res.status(200).json({
      success: true,
      count: blottersWithUrls.length,
      blotters: blottersWithUrls,
    });
  } catch (error) {
    console.error("Error fetching user blotters:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @route GET /api/blotters/:blotterId/attachments/:attachmentIndex
 * Fetch a blotter attachment
 */
export const getBlotterAttachment = async (req, res) => {
  try {
    const { blotterId, attachmentIndex } = req.params;
    const index = parseInt(attachmentIndex);

    console.log(`Fetching attachment: blotterId=${blotterId}, index=${index}`);

    const blotter = await Blotter.findById(blotterId);
    if (!blotter) {
      console.log(`Blotter not found: ${blotterId}`);
      return res.status(404).json({
        success: false,
        message: "Blotter not found",
      });
    }

    if (!blotter.attachments || blotter.attachments.length === 0) {
      console.log(`No attachments found for blotter: ${blotterId}`);
      return res.status(404).json({
        success: false,
        message: "No attachments found",
      });
    }

    if (!blotter.attachments[index]) {
      console.log(
        `Attachment index ${index} not found. Total attachments: ${blotter.attachments.length}`
      );
      return res.status(404).json({
        success: false,
        message: `Attachment not found at index ${index}`,
      });
    }

    const attachment = blotter.attachments[index];

    // DEBUG: Log the type of data we're dealing with
    console.log(`Attachment data type: ${typeof attachment.data}`);
    console.log(`Is Buffer: ${Buffer.isBuffer(attachment.data)}`);
    console.log(`Data constructor: ${attachment.data?.constructor?.name}`);

    let buffer;

    // Handle different data formats
    if (Buffer.isBuffer(attachment.data)) {
      // Already a buffer
      buffer = attachment.data;
    } else if (attachment.data && attachment.data.buffer) {
      // MongoDB Binary type - convert to Buffer
      buffer = Buffer.from(attachment.data.buffer);
    } else if (typeof attachment.data === "string") {
      // Base64 string - convert to Buffer
      const base64Data = attachment.data.includes(",")
        ? attachment.data.split(",")[1]
        : attachment.data;
      buffer = Buffer.from(base64Data, "base64");
    } else if (attachment.data && typeof attachment.data === "object") {
      // Try to convert object to buffer
      try {
        buffer = Buffer.from(Object.values(attachment.data));
      } catch (err) {
        console.error("Failed to convert object to buffer:", err);
        return res.status(500).json({
          success: false,
          message: "Invalid attachment data format",
        });
      }
    } else {
      console.log(`Invalid attachment data format: ${attachment.data}`);
      return res.status(500).json({
        success: false,
        message: "Invalid attachment data",
      });
    }

    console.log(
      `Serving attachment: ${attachment.filename}, type: ${attachment.mimetype}, size: ${buffer.length}`
    );

    // Encode filename properly to handle special characters (RFC 5987)
    const encodedFilename = encodeURIComponent(attachment.filename);

    // Set appropriate headers
    res.set("Content-Type", attachment.mimetype || "application/octet-stream");
    res.set("Content-Length", buffer.length);
    res.set(
      "Content-Disposition",
      `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    // Add CORS headers for image requests
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");

    // Send the binary data
    res.send(buffer);
  } catch (error) {
    console.error("Error getting blotter attachment:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/blotters/:blotterId/debug
 * Debug endpoint to check attachment data structure
 */
export const debugBlotterAttachments = async (req, res) => {
  try {
    const { blotterId } = req.params;

    const blotter = await Blotter.findById(blotterId);
    if (!blotter) {
      return res
        .status(404)
        .json({ success: false, message: "Blotter not found" });
    }

    const attachmentInfo = blotter.attachments.map((att, idx) => ({
      index: idx,
      filename: att.filename,
      mimetype: att.mimetype,
      size: att.size,
      dataType: typeof att.data,
      isBuffer: Buffer.isBuffer(att.data),
      constructor: att.data?.constructor?.name,
      hasBuffer: att.data?.buffer ? "yes" : "no",
      dataLength: att.data?.length || att.data?.buffer?.byteLength || "unknown",
    }));

    res.json({
      success: true,
      blotterId: blotter._id,
      totalAttachments: blotter.attachments.length,
      attachments: attachmentInfo,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route PUT /api/blotters/update/:blotterId
 * Update a blotter
 */
export const updateBlotter = async (req, res) => {
  try {
    const { blotterId } = req.params;
    const { status, assigned_officer_id, notes } = req.body;

    const blotter = await Blotter.findById(blotterId);
    if (!blotter) {
      return res
        .status(404)
        .json({ success: false, message: "Blotter not found" });
    }

    // Validate officer if provided
    if (assigned_officer_id) {
      const officer = await Officer.findById(assigned_officer_id);
      if (!officer) {
        return res
          .status(404)
          .json({ success: false, message: "Officer not found" });
      }
      blotter.assigned_Officer = assigned_officer_id;
    } else {
      blotter.assigned_Officer = null;
    }

    // Update fields
    if (status) blotter.status = status;
    if (notes !== undefined) blotter.notes = notes;

    await blotter.save();

    // Populate before sending response
    await blotter.populate(
      "user_id",
      "personal_info email phone_number profile_picture"
    );
    await blotter.populate("assigned_Officer", "first_name last_name");

    res
      .status(200)
      .json({
        success: true,
        message: "Blotter updated successfully",
        data: blotter,
      });
  } catch (error) {
    console.error("Error updating blotter:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @route DELETE /api/blotters/delete/:blotterId
 * Delete a blotter
 */
export const deleteBlotter = async (req, res) => {
  try {
    const { blotterId } = req.params;

    const blotter = await Blotter.findById(blotterId);
    if (!blotter) {
      return res
        .status(404)
        .json({ success: false, message: "Blotter not found" });
    }

    await Blotter.findByIdAndDelete(blotterId);

    res
      .status(200)
      .json({ success: true, message: "Blotter deleted successfully" });
  } catch (error) {
    console.error("Error deleting blotter:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
