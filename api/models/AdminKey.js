const mongoose = require('mongoose');

const adminKeySchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  models: {
    type: [String],
    default: [],
  },
  limit: {
    type: Number,
    default: 1000000,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFallback: {
    type: Boolean,
    default: false,
  },
  baseURL: {
    type: String,
    default: '',
  }
}, { timestamps: true });

const AdminKey = mongoose.models.AdminKey || mongoose.model('AdminKey', adminKeySchema);

module.exports = { AdminKey };
