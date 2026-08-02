const express = require('express');
const { MeiliSearch } = require('meilisearch');
const { isEnabled } = require('@aladin/api');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const router = express.Router();

router.use(requireJwtAuth);

router.get('/enable', async function (req, res) {
  // Always enable search now that it natively uses MongoDB
  return res.send(true);
});

module.exports = router;
