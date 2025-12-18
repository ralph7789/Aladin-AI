const mongoose = require('mongoose');
const { createModels } = require('@aladin/data-schemas');
const { connectDb } = require('./connect');
const indexSync = require('./indexSync');

createModels(mongoose);

module.exports = { connectDb, indexSync };
