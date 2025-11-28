import User from "../models/User.js";
import ApplicationProfile from "../models/ApplicationProfile.js";

/**
 * Get the current user's application
 */
export const getApplication = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ profile: null });

    const profile = await ApplicationProfile.findOne({ user: req.user.id });

    res.json({
      profile: profile || {
        personal_info: user.personal_info || {},
        address: user.address || {},
        other_info: user.other_info || {},
        family: user.family || {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Save or update the current user's application
 */
export const saveApplication = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { personal_info, address, family, other_info } = req.body;

    let profile = await ApplicationProfile.findOne({ user: req.user.id });

    // Merge updates into user document
    user.personal_info = {
      ...(user.personal_info || {}),
      ...(personal_info || {}),
    };
    user.address = { ...(user.address || {}), ...(address || {}) };
    user.other_info = { ...(user.other_info || {}), ...(other_info || {}) };
    user.family = { ...(user.family || {}), ...(family || {}) };

    if (!profile) {
      profile = new ApplicationProfile({
        user: req.user.id,
        personal_info,
        address,
        family,
        other_info,
      });
    } else {
      profile.personal_info = {
        ...(profile.personal_info || {}),
        ...personal_info,
      };
      profile.address = { ...(profile.address || {}), ...address };
      profile.family = { ...(profile.family || {}), ...family };
      profile.other_info = { ...(profile.other_info || {}), ...other_info };
    }

    await user.save();
    await profile.save();

    res.json({
      success: true,
      message: "Application form saved successfully",
      profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Admin: get any user's application
 */
export const getUserApplicationById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await ApplicationProfile.findOne({ user: req.params.id });
    if (!profile)
      return res.status(404).json({ message: "Application profile not found" });

    res.json({
      profile: {
        personal_info: user.personal_info || {},
        address: user.address || {},
        other_info: user.other_info || {},
        family: user.family || {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
