const mongoose = require('mongoose');
const { connectDb } = require('./db/connect');
const { createModels } = require('@aladin/data-schemas');

async function fixLicenses() {
  try {
    console.log('Connecting to database...');
    // Ensure we are not conflicting with running backend
    await connectDb();
    console.log('Connected!');

    createModels(mongoose);
    const User = mongoose.model('User');
    const License = mongoose.model('License');

    // 1. Find the Licenses to get their IDs
    const kuchooDev = await License.findOne({ name: 'KuchooDev' });
    const jekoCore = await License.findOne({ name: 'JekoCore' });

    if (!kuchooDev || !jekoCore) {
        console.error('Could not find licenses! Run seed first?');
        process.exit(1);
    }

    console.log(`Found License KuchooDev: ${kuchooDev._id}`);
    console.log(`Found License JekoCore: ${jekoCore._id}`);

    // 2. Update Jeko -> KuchooDev
    const jeko = await User.findOne({ username: 'Jeko' });
    if (jeko) {
        console.log(`Updating Jeko (current license: ${jeko.license})...`);
        jeko.license = kuchooDev._id;
        await jeko.save();
        console.log('Jeko updated successfully.');
    } else {
        console.log('User Jeko not found.');
    }

    // 3. Update Aladin -> JekoCore
    const aladin = await User.findOne({ username: 'Aladin' });
    if (aladin) {
        console.log(`Updating Aladin (current license: ${aladin.license})...`);
        aladin.license = jekoCore._id;
        await aladin.save();
        console.log('Aladin updated successfully.');
    } else {
        console.log('User Aladin not found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error fixing licenses:', err);
    process.exit(1);
  }
}

fixLicenses();
