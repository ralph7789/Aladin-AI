import { Schema } from 'mongoose';

const licenseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    models: {
      type: [String], // List of allowed models
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    maxChats: {
      type: Number,
      default: -1, // Unlimited
    },
  },
  { timestamps: true },
);

export default licenseSchema;
