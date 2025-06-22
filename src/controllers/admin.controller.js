const Municipality = require("../models/Municipality.model");
const { registerAdmin, loginAdmin, validateOtpAdmin, getAdminProfile, logoutAdmin, approveMunicipalityById, rejectMunicipalityById } = require("../service/admin.service");

// Handle request for Admin register
exports.adminRegister = (io) => async (req, res) => {
  try {
    const result = await registerAdmin(req, io);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// Login with email and password (sends OTP) of Admin
exports.adminLogin = (io) => async (req, res) => {
  try {
    const result = await loginAdmin(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// OTP validation for Admin
exports.adminValidateWithOTP = (io) => async (req, res) => {
  console.log(req.body);

  try {
    const result = await validateOtpAdmin(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// Get profile of Admin
exports.adminProfile = (io) => async (req, res) => {
  try {
    const result = await getAdminProfile(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// Logout and blacklist token of Admin
exports.adminLogout = (io) => async (req, res) => {
  try {
    const token = req.headers?.authorization || req.body?.authorization;
    const result = await logoutAdmin(token);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

