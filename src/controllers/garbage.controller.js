const garbageService = require("../service/garbage.service");

exports.reportGarbage = (io) => async (req, res) => {
  try {
    const reportedBy = req.user.id;
    const result = await garbageService.createGarbageReport(reportedBy, req, io);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[ERROR] reportGarbage:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageReportedByCitizen = (io) => async (req, res) => {
  try {
    const reportedBy = req.user.id;
    const result = await garbageService.GarbageByCitizen(reportedBy, req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] getGarbageReportedByCitizen:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getAllGarbages = (io) => async (req, res) => {
  try {
    const result = await garbageService.AllGarbage(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] getAllGarbages:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageAcceptedByMunicipality = (io) => async (req, res) => {
  try {
    const acceptedBy = req.user.id;
    const result = await garbageService.GarbageByMunicipality(acceptedBy, req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] getGarbageAcceptedByMunicipality:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getGarbageDetailsById = (io) => async (req, res) => {
  try {
    const id = req.params.garbageId;
    const result = await garbageService.garbageById(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] getGarbageDetailsById:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};


exports.updateGarbageStatus = (io) => async (req, res) => {
  try {
    const { garbageId } = req.params;
    const { status } = req.body;
    const result = await garbageService.updateGarbageStatusService(garbageId, status, req, io);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] updateGarbageStatus:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
