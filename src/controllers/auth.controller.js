import { User, Officer } from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "2d" });
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    // 1. Destructure all fields including phone_number
    const { given_name, middle_name, surname, email, password, phone_number } =
      req.body;

    // 2. Validate all required fields
    if (!given_name || !middle_name || !surname || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Given name, middle name, surname, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const profile_picture = `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`;

    // 3. Create user with all fields mapped correctly
    const user = new User({
      personal_info: {
        given_name,
        middle_name,
        surname,
      },
      email,
      password,
      phone_number: phone_number || "", // Ensure phone number is saved
      profile_picture: profile_picture,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        given_name: user.personal_info.given_name,
        middle_name: user.personal_info.middle_name,
        surname: user.personal_info.surname,
        email: user.email,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Error in register:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Register a new admin/officer
 * @route POST /api/auth/admin/register
 */
export const registerAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if email already exists
    const existingEmail = await Officer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Create officer
    const officer = new Officer({ first_name, last_name, email, password, role: "ADMIN" });
    await officer.save();

    const token = generateToken(officer._id);

    res.status(201).json({
      success: true,
      token,
      officer: {
        _id: officer._id,
        first_name: officer.first_name,
        last_name: officer.last_name,
        email: officer.email,
        role: officer.role,
      },
    });
  } catch (error) {
    console.error("Error in admin register:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        given_name: user.personal_info.given_name,
        middle_name: user.personal_info.middle_name,
        surname: user.personal_info.surname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Login admin/officer
 * @route POST /api/auth/admin/login
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Find officer
    const officer = await Officer.findOne({ email });
    if (!officer) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(officer._id);

    res.status(200).json({
      success: true,
      token,
      officer: {
        _id: officer._id,
        first_name: officer.first_name,
        last_name: officer.last_name,
        email: officer.email,
      },
    });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
