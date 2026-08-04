const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const UserSchema = new mongoose.Schema({ email: String, role: String }, { strict: false });

async function test() {
  try {
    const mongoURI = 'mongodb+srv://aladin-user:AladinSecurePassword123!@aladincluster.kbav8w1.mongodb.net/aladin?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    
    const User = mongoose.model('User', UserSchema);
    const user = await User.findOne({ email: 'jeko@aladin.ai' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    const JWT_SECRET = '16f8c0ef4a5d391b26034086c628469d3f9f497f08163ab9b40137092f2909ef';
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    
    // In AuthService.js, it signs with `{ id: userId, username: user.username, email: user.email }`
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Generated Token for jeko@aladin.ai');
    
    try {
      const res = await axios.get('https://aladin-api-xhoj.onrender.com/api/models', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API Response STATUS:', res.status);
      console.log('API Response DATA:', JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.log('API Error:', e.response?.status, e.response?.data);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
test();
