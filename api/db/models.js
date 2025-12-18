const mongoose = require('mongoose');
const { createModels } = require('@aladin/data-schemas');
const models = createModels(mongoose);

module.exports = { ...models };
