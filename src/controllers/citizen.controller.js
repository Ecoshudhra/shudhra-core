const { validationResult } = require("express-validator");
const {
  registerCitizenService,
  loginCitizenService,
  validateOtpService,
  sendOtpService,
  resetPasswordService,
  getCitizenProfileService,
  logoutCitizenService,
  updateCitizenAddressService
} = require("../service/citizen.service");

// Register ✔
exports.citizenRegister = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await registerCitizenService(req.body, io);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Login ✔
exports.citizenLogin = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await loginCitizenService(req.body, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// OTP Validation ✔
exports.citizenValidateWithOTP = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await validateOtpService(req.body, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Send OTP ✔
exports.sendOtp = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await sendOtpService(req.body, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Reset Password ✔
exports.resetPassword = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  const token = req.headers?.authorization || req.body?.authorization;
  try {
    const result = await resetPasswordService(req.body, io, token);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Get Profile ✔
exports.citizenProfile = () => async (req, res) => {
  try {
    const result = await getCitizenProfileService(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Logout ✔
exports.citizenLogout = () => async (req, res) => {
  try {
    const token = req.headers?.authorization || req.body?.authorization;
    const result = await logoutCitizenService(token);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Update Address ✔
exports.updateAddress = () => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await updateCitizenAddressService(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
