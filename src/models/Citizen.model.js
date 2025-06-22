const mongoose = require('mongoose');

const CitizenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] },
        state: { type: String },
        district: { type: String },
        address: { type: String },
        city: { type: String },
        pincode: { type: String },
    },
    isLocationUpdated: { type: Boolean, default: false },
    ecoCrystals: {
        dailyReward: { type: Number, default: 5 },
        rewardPerReport: { type: Number, default: 10 },
        totalEarned: { type: Number, default: 0 }
    },
    avatar: {
        type: String,
        default: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100)}`
    },
    banner: {
        type: String,
        default: 'https://res.cloudinary.com/postman/image/upload/t_user_hero/v1/user_hero/def-hero-image'
    },
    garbageReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GarbageReport' }]

}, { timestamps: true });

// CitizenSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Citizen', CitizenSchema);
