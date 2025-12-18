const mongoose = require('mongoose');
const { createMethods, createModels } = require('@aladin/data-schemas');
const methods = createMethods(mongoose);
const models = createModels(mongoose);
const { comparePassword } = require('./userMethods');
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { File } = require('~/db/models');

const seedDatabase = async () => {
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  await methods.ensureDefaultCategories();
  await seedLicenses();
  await seedUsers();
};

const seedLicenses = async () => {
  const { License } = models;
  const { getEnforcer } = require('~/server/services/casbin');
  const enforcer = await getEnforcer();

  const licenses = [
    { name: 'KuchooDev', models: ['*'], features: ['*'], maxChats: -1 },
    { name: 'JekoCore', models: ['*'], features: ['*'], maxChats: -1 },
  ];

  for (const l of licenses) {
    let license = await License.findOne({ name: l.name });
    if (!license) {
      license = await License.create(l);
      console.log(`Created License: ${l.name}`);
    }
    
    // Ensure policies exist
    for (const m of l.models) {
        await enforcer.addPolicy(l.name, m, 'access');
    }
  }
};

const seedUsers = async () => {
  const { User } = models;
  const bcrypt = require('bcryptjs');
  const { getEnforcer } = require('~/server/services/casbin');
  const enforcer = await getEnforcer();

  const users = [
    {
      username: 'Jeko',
      email: 'jeko@aladin.ai',
      password: 'password123',
      name: 'Jeko',
      role: 'ADMIN',
      license: 'KuchooDev'
    },
    {
      username: 'Aladin',
      email: 'aladin@aladin.ai',
      password: 'password123',
      name: 'Aladin',
      role: 'ADMIN',
      license: 'JekoCore'
    }
  ];

  for (const u of users) {
    let user = await User.findOne({ username: u.username });
    if (!user) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      user = await User.create({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        emailVerified: true,
      });
      console.log(`Created User: ${u.username}`);
    }
    
    // Check if grouping policy exists, if not add it
    const hasGrouping = await enforcer.hasGroupingPolicy(u.username, u.license);
    if (!hasGrouping) {
        await enforcer.addGroupingPolicy(u.username, u.license);
        console.log(`Assigned license ${u.license} to user ${u.username}`);
    }
  }
};

module.exports = {
  ...methods,
  seedDatabase,
  comparePassword,
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,

  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,

  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,

  getPreset,
  getPresets,
  savePreset,
  deletePresets,

  Files: File,
  License: models.License,
  User: models.User,
};
