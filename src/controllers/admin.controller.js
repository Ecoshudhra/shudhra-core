const { validationResult } = require("express-validator");
const { registerAdmin, loginAdmin, validateOtpAdmin, getAdminProfile, logoutAdmin } = require("../service/admin.service");

exports.adminRegister = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await registerAdmin(req, io);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.adminLogin = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await loginAdmin(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

exports.adminValidateWithOTP = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const result = await validateOtpAdmin(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

exports.adminProfile = (io) => async (req, res) => {
  try {
    const result = await getAdminProfile(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.adminLogout = (io) => async (req, res) => {
  try {
    const token = req.headers?.authorization || req.body?.authorization;
    const result = await logoutAdmin(token);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

