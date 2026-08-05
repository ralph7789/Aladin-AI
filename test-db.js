const mongoose = require('mongoose');
const AdminKeySchema = new mongoose.Schema({ provider: String, key: String, models: [String], isActive: Boolean, isFallback: Boolean, limit: Number }, { strict: false });

async function test() {
  try {
    const mongoURI = 'mongodb+srv://aladin-user:AladinSecurePassword123!@aladincluster.kbav8w1.mongodb.net/aladin?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    
    const AdminKey = mongoose.model('AdminKey', AdminKeySchema);
    
    const keys = await AdminKey.find({});
    console.log('Admin Keys in DB:', JSON.stringify(keys, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
test();
