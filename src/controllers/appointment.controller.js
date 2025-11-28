import User from "../models/User.js";

/**
 * Create a new appointmentg
 * Accessible only to 'user' role
 */
export const createAppointment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { purpose, policeStation, appointmentDate, timeSlot } = req.body;

    // Validate required fields
    if (!purpose || !policeStation || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Create new appointment
    const newAppointment = {
      purpose,
      policeStation,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: "pending",
      paymentStatus: "unpaid",
      amount: 250,
      createdAt: new Date(),
    };

    user.appointments.push(newAppointment);
    await user.save();

    // Get the newly created appointment (last one in array)
    const createdAppointment = user.appointments[user.appointments.length - 1];

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment: createdAppointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all appointments for the current user
 * Accessible only to 'user' role
 */
export const getMyAppointments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      appointments: user.appointments || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get a single appointment by ID
 * Accessible only to 'user' role
 */
export const getAppointmentById = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const appointment = user.appointments.id(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an appointment
 * Accessible only to 'user' role
 */
export const updateAppointment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const appointment = user.appointments.id(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const {
      purpose,
      policeStation,
      appointmentDate,
      timeSlot,
      paymentStatus,
      status,
    } = req.body;

    // Allow payment status updates even for paid appointments
    if (paymentStatus) appointment.paymentStatus = paymentStatus;
    if (status) appointment.status = status;

    // Don't allow updating appointment details if already paid (unless it's just payment/status update)
    if (appointment.paymentStatus === "paid" && !paymentStatus && !status) {
      return res.status(400).json({
        message: "Cannot update paid appointment details",
      });
    }

    if (purpose) appointment.purpose = purpose;
    if (policeStation) appointment.policeStation = policeStation;
    if (appointmentDate)
      appointment.appointmentDate = new Date(appointmentDate);
    if (timeSlot) appointment.timeSlot = timeSlot;

    await user.save();

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Cancel an appointment
 * Accessible only to 'user' role
 */
export const cancelAppointment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const appointment = user.appointments.id(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Don't allow canceling if already paid
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Cannot cancel paid appointment. Please contact support.",
      });
    }

    appointment.status = "cancelled";
    await user.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete an appointment completely
 * Accessible only to 'user' role
 */
export const deleteAppointment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const appointment = user.appointments.id(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only allow deletion if unpaid and cancelled/pending
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Cannot delete paid appointment",
      });
    }

    appointment.remove();
    await user.save();

    res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Admin: Get all appointments from all users
 * Accessible only to 'admin' role
 */
export const getAllAppointments = async (req, res) => {
  try {
    const users = await User.find({
      "appointments.0": { $exists: true },
    }).select(
      "appointments personal_info.givenName personal_info.surname email"
    );

    const allAppointments = [];
    users.forEach((user) => {
      user.appointments.forEach((apt) => {
        allAppointments.push({
          ...apt.toObject(),
          userName: `${user.personal_info?.givenName || ""} ${
            user.personal_info?.surname || ""
          }`.trim(),
          userEmail: user.email,
        });
      });
    });

    res.json({
      success: true,
      appointments: allAppointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
