const mongoose = require("mongoose");

module.exports = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log(`✅ MongoDB connected -${process.env.DB_URL}`);
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
};
