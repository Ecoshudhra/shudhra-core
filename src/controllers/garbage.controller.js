const garbageService = require("../service/garbage.service");

exports.reportGarbage = (io) => async (req, res) => {

  try {
    const reportedBy = req.user.id;
    const result = await garbageService.createGarbageReport(reportedBy, req);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[ERROR] reportGarbage:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Internal Server Error' });
  }
};


exports.updateGarbageStatus = (io) => async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await garbageService.updateGarbageStatusService(id, status, req);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] updateGarbageStatus:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};
