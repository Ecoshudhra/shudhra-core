const { validationResult } = require("express-validator");
const {
  requestMunicipalityService,
  loginMunicipalityService,
  validateMunicipalityOtpService,
  sendMunicipalityOtpService,
  resetMunicipalityPasswordService,
  getMunicipalityProfileService,
  logoutMunicipalityService,
  fetchMunicipalitiesService,
  approveMunicipalityService,
  rejectMunicipalityService,
  updateMunicipalityProfileService
} = require("../service/municipality.service");

exports.municipalityRequest = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await requestMunicipalityService(req.body, io);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.municipalityLogin = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await loginMunicipalityService(req.body, io);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.municipalityValidateOtp = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await validateMunicipalityOtpService(req.body, io);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.sendOtp = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await sendMunicipalityOtpService(req.body, io);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const token = req.headers.authorization;
    const result = await resetMunicipalityPasswordService({ ...req.body }, io, token);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.municipalityProfile = () => async (req, res) => {
  try {
    const result = await getMunicipalityProfileService(req.user.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.municipalityLogout = () => async (req, res) => {
  try {
    const token = req.headers.authorization;
    const result = await logoutMunicipalityService(token);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.getAllMunicipalities = () => async (req, res) => {
  try {
    const result = await fetchMunicipalitiesService(req.query);
    return res.status(result.success ? 200 : 400).json({ success: result.success, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.approveMunicipality = () => async (req, res) => {
  try {
    const result = await approveMunicipalityService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.rejectMunicipality = () => async (req, res) => {
  try {
    const result = await rejectMunicipalityService(req.params.id, req.body.reason);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.updateMunicipalityProfile = () => async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty() === false) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await updateMunicipalityProfileService(req.body, req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
