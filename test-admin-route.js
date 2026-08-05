require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aladin');
  
  try {
    // Simulate what getLiteLLMConfig does
    throw new Error('LITELLM_MASTER_KEY is not defined in environment');
  } catch (error) {
    console.error('[AdminAPI] LiteLLM Error:', error.message);
    
    try {
      const AdminKey = mongoose.models.AdminKey || require('./api/models/AdminKey').AdminKey;
      const fallbackKeys = await AdminKey.find({}).lean();
      console.log("Fallback keys found:", fallbackKeys.length);
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
    }
  }
  
  mongoose.disconnect();
}

test();
