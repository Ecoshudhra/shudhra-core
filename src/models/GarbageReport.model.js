const mongoose = require('mongoose');

const REPORT_STATUS = ['Pending', 'In Progress', 'Resolved']
const WASTE_TYPES = ['Organic', 'Inorganic', 'Mixed',];

const GarbageReportSchema = new mongoose.Schema({
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },
    assignedToMunicipality: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality', required: true },
    garbageUrl: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
        address: { type: String, required: true }
    },
    type: {
        type: String,
        enum: WASTE_TYPES,
        required: true
    },
    status: { type: String, enum: REPORT_STATUS, default: 'Pending' }
}, { timestamps: true });

GarbageReportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('GarbageReport', GarbageReportSchema);