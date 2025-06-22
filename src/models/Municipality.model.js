const mongoose = require('mongoose');

const VEHICLE_TYPES = [
    'Tippers',
    'Dumper Placers',
    'Refuse Compactors',
    'Hopper Tippers',
    'Mini Garbage Vans',
    'Auto Tippers',
    'Battery-Operated Rickshaw Tippers',
    'Pushcarts',
    'Tricycles with Bins',
    'Hook Loaders',
    'Covered Bin Tippers',
    'Compactor with Partition',
    'Electric Garbage Vans'
];
const MUNICIPALITY_TYPE = ['Municipal Corporation', 'Municipal Council', 'Nagar Panchayat'];
const MUNICIPALITY_STATUS = ['pending', 'approved', 'rejected', 'suspended',];

const MunicipalitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    primaryEmail: { type: String, required: true, lowercase: true, trim: true, unique: true },
    secondaryEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    type: { type: String, enum: MUNICIPALITY_TYPE, required: true, },
    ulbCode: { type: String, unique: true, trim: true, required: true, }, // unique ULB code
    registrationNumber: { type: String }, // official municipal ID or 
    govCertificateUrl: { type: String }, // government certificate URL

    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        zone: { type: String, required: true },
        coordinates: { type: [Number], required: true },
        state: { type: String, required: true },
        district: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        pincode: { type: String, required: true },
        wardNumber: { type: String, required: true },
    },

    status: { type: String, enum: MUNICIPALITY_STATUS, default: 'pending' },
    isProfileComplete: { type: Boolean, default: false },
    vehicle: [{ type: String, enum: VEHICLE_TYPES }],
    manPower: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 }
    },
    resourceImages: { type: Array, default: [] },
    assignedGarbageReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GarbageReport' }]


}, { timestamps: true });

MunicipalitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Municipality', MunicipalitySchema);
