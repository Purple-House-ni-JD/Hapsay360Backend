import { User, ClearanceApplication } from "../models/index.js";
import Payment from "../models/Payment.js";

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

    // 1. Extract attachments from the request body
    const {
      purpose,
      policeStation,
      appointmentDate,
      timeSlot,
      paymentMethodId,
      amount,
      attachments, // <--- Get attachments here
    } = req.body;

    if (!purpose)
      return res
        .status(400)
        .json({ success: false, message: "Purpose is required" });

    let paymentMethod = null;
    if (paymentMethodId) {
      paymentMethod = await Payment.findById(paymentMethodId);
    }

    // 2. Process Attachments (Base64 to Buffer)
    let processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      processedAttachments = attachments.map((att) => {
        if (att.data && typeof att.data === "string") {
          const base64Data = att.data.includes(",")
            ? att.data.split(",")[1]
            : att.data;
          return {
            filename: att.filename || `proof_${Date.now()}.jpg`,
            mimetype: att.mimetype || "image/jpeg",
            data: Buffer.from(base64Data, "base64"),
            size: Buffer.from(base64Data, "base64").length,
          };
        }
        return att;
      });
    }

    const clearance = new ClearanceApplication({
      user_id: user._id,
      purpose,
      status: "pending",
      station_id: policeStation || undefined,
      appointment_date: appointmentDate ? new Date(appointmentDate) : undefined,
      time_slot: timeSlot || undefined,
      attachments: processedAttachments, // <--- Save attachments immediately
      payment: {
        status: "pending",
        method: paymentMethod ? paymentMethod.payment_method : undefined,
        amount: amount || 0,
        payment_method_id: paymentMethodId || undefined,
      },
    });

    await clearance.save();
    await clearance.populate("station_id");

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
    })
      .populate("station_id")
      .sort({ createdAt: -1 }); // Most recent first

    // Populate payment method details if available
    const clearancesWithPayment = await Promise.all(
      clearances.map(async (clearance) => {
        const obj = clearance.toObject();
        delete obj.__v;

        // Fetch payment method details if payment_method_id exists
        if (obj.payment?.payment_method_id) {
          try {
            const paymentMethod = await Payment.findById(
              obj.payment.payment_method_id
            );
            if (paymentMethod) {
              obj.payment.payment_details = {
                payment_method: paymentMethod.payment_method,
                card_last4: paymentMethod.card_last4,
                provider: paymentMethod.provider,
              };
            }
          } catch (err) {
            console.error("Error fetching payment method:", err);
          }
        }

        return obj;
      })
    );

    res.status(200).json({
      success: true,
      count: clearancesWithPayment.length,
      data: clearancesWithPayment,
    });
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
      .populate("station_id")
      .sort({ createdAt: -1 });

    // Populate payment method details
    const clearancesWithPayment = await Promise.all(
      clearances.map(async (clearance) => {
        const obj = clearance.toObject();
        delete obj.__v;

        if (obj.payment?.payment_method_id) {
          try {
            const paymentMethod = await Payment.findById(
              obj.payment.payment_method_id
            );
            if (paymentMethod) {
              obj.payment.payment_details = {
                payment_method: paymentMethod.payment_method,
                card_last4: paymentMethod.card_last4,
                provider: paymentMethod.provider,
              };
            }
          } catch (err) {
            console.error("Error fetching payment method:", err);
          }
        }

        return obj;
      })
    );

    res.status(200).json({
      success: true,
      count: clearancesWithPayment.length,
      data: clearancesWithPayment,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Get single clearance by ID
 * @route GET /api/clearance/:id
 */
export const getClearanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const clearance = await ClearanceApplication.findById(id)
      .populate("user_id", "-password")
      .populate("station_id");

    if (!clearance) {
      return res
        .status(404)
        .json({ success: false, message: "Clearance not found" });
    }

    // Check authorization
    if (
      clearance.user_id._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: cannot access this clearance",
      });
    }

    const obj = clearance.toObject();
    delete obj.__v;

    // Populate payment method details
    if (obj.payment?.payment_method_id) {
      try {
        const paymentMethod = await Payment.findById(
          obj.payment.payment_method_id
        );
        if (paymentMethod) {
          obj.payment.payment_details = {
            payment_method: paymentMethod.payment_method,
            card_last4: paymentMethod.card_last4,
            provider: paymentMethod.provider,
          };
        }
      } catch (err) {
        console.error("Error fetching payment method:", err);
      }
    }

    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error("Error fetching clearance:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Delete clearance by ID
 * @route DELETE /api/clearance/:id
 */
export const deleteClearance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    const clearance = await ClearanceApplication.findById(id);
    if (!clearance) {
      return res
        .status(404)
        .json({ success: false, message: "Clearance not found" });
    }

    // Only the owner or admin can delete
    if (clearance.user_id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: cannot delete this clearance",
      });
    }

    await ClearanceApplication.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Clearance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting clearance:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Update clearance by ID
 * @route PATCH /api/clearance/:id
 */
export const updateClearance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, paymentStatus, payment, attachments } = req.body; // Add attachments here

    const clearance = await ClearanceApplication.findById(id);
    if (!clearance) {
      return res
        .status(404)
        .json({ success: false, message: "Clearance not found" });
    }

    // Auth Check
    if (clearance.user_id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update fields
    if (status) clearance.status = status;

    // Update Payment
    if (paymentStatus || payment) {
      clearance.payment = {
        ...clearance.payment,
        ...(paymentStatus && { status: paymentStatus }),
        ...(payment && payment),
      };
    }

    if (attachments && Array.isArray(attachments)) {
      const attachmentArray = attachments.map((att) => {
        // ... (conversion logic stays the same) ...
        if (att.data && typeof att.data === "string") {
          const base64Data = att.data.includes(",")
            ? att.data.split(",")[1]
            : att.data;
          return {
            filename: att.filename || `proof_${Date.now()}.jpg`,
            mimetype: att.mimetype || "image/jpeg",
            data: Buffer.from(base64Data, "base64"),
            size: Buffer.from(base64Data, "base64").length,
          };
        }
        return att;
      });

      // Append new attachments to existing ones
      clearance.attachments = [
        ...(clearance.attachments || []),
        ...attachmentArray,
      ];
    }

    await clearance.save();

    // Prepare response with URL metadata for Admin
    const response = clearance.toObject();
    if (response.attachments && response.attachments.length > 0) {
      response.attachments = response.attachments.map((att, index) => ({
        filename: att.filename,
        mimetype: att.mimetype,
        size: att.size,
        // This URL allows the Admin to fetch the image
        url: `/api/clearance/${clearance._id}/attachments/${index}`,
      }));
    }
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

// 2. ADD THIS NEW FUNCTION (So Admin can see the image) (mao ni gamita kharl or erase lang ni if dili needed)
export const getClearanceAttachment = async (req, res) => {
  try {
    const { id, index } = req.params;
    const attachmentIndex = parseInt(index);

    const clearance = await ClearanceApplication.findById(id);
    if (!clearance || !clearance.attachments[attachmentIndex]) {
      return res
        .status(404)
        .json({ success: false, message: "Attachment not found" });
    }

    const attachment = clearance.attachments[attachmentIndex];

    res.set("Content-Type", attachment.mimetype);
    res.send(attachment.data); // Send the image buffer
  } catch (error) {
    console.error("Error getting attachment:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
