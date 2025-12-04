import Payment from "../models/Payment.js";

/**
 * Create a new payment method
 */
export const createPayment = async (req, res) => {
  try {
    const { user_id, payment_method, card_last4, provider } = req.body;

    if (!user_id || !payment_method) {
      return res
        .status(400)
        .json({ error: "user_id and payment_method are required" });
    }

    const newPayment = new Payment({
      user_id,
      payment_method,
      card_last4,
      provider,
    });

    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create payment method" });
  }
};

/**
 * Get all payments
 */
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate(
      "user_id",
      "email personal_info"
    );
    res.status(200).json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

/**
 * Get a single payment by ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate(
      "user_id",
      "email personal_info"
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

/**
 * Update a payment by ID
 */
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const payment = await Payment.findByIdAndUpdate(id, updates, { new: true });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};

/**
 * Delete a payment by ID
 */
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByIdAndDelete(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
};
