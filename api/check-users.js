const { connectDb } = require('./db/connect');
const mongoose = require('mongoose');
const { createModels } = require('@aladin/data-schemas');

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    // Hint: If this fails, it's likely because the backend is already running and locking the DB.
    try {
      await connectDb();
    } catch (e) {
      console.error('\n!!! Connection Failed !!!');
      console.error('If the Aladin backend is currently running, please STOP it first.');
      console.error('The local database cannot be accessed by two processes simultaneously.\n');
      throw e;
    }
    console.log('Connected!');

    // Initialize models
    createModels(mongoose);
    const User = mongoose.model('User');

    const users = await User.find({}, 'username email role emailVerified');

    console.log('\n--- Registered Users ---');
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      console.table(
        users.map((u) => ({
          Username: u.username,
          Email: u.email,
          Role: u.role,
          Verified: u.emailVerified,
        })),
      );
    }
    console.log('------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
