const { validationResult } = require("express-validator");
const {
  createGarbageReport,
  GarbageByCitizen,
  AllGarbage,
  GarbageByMunicipality,
  garbageById,
  updateGarbageStatusService } = require("../service/garbage.service");

exports.reportGarbage = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const reportedBy = req.user.id;
    const result = await createGarbageReport(reportedBy, req, io);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] reportGarbage:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageReportedByCitizen = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const reportedBy = req.user.id;
    const result = await GarbageByCitizen(reportedBy, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] getGarbageReportedByCitizen:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

exports.getAllGarbages = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await AllGarbage(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] getAllGarbages:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageAcceptedByMunicipality = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const acceptedBy = req.user.id;
    const result = await GarbageByMunicipality(acceptedBy, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] getGarbageAcceptedByMunicipality:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageDetailsById = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const id = req.params.garbageId;
    const result = await garbageById(id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] getGarbageDetailsById:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

exports.updateGarbageStatus = (io) => async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { garbageId } = req.params;
    const { status } = req.body;
    const result = await updateGarbageStatusService(garbageId, status, req, io);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] updateGarbageStatus:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
