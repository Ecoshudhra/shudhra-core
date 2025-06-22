const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete after expiry
  }
});

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);
