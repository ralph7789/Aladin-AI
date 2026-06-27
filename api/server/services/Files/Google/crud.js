const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');
const { sleep } = require('@aladin/agents');
const { logger } = require('@aladin/data-schemas');

/**
 * Uploads a file to Google AI File API.
 *
 * @param {Object} params - The params object.
 * @param {ServerRequest} params.req - The request object from Express.
 * @param {Express.Multer.File} params.file - The file uploaded to the server via multer.
 * @param {string} params.apiKey - The Google API key.
 * @returns {Promise<Object>}
 */
async function uploadGoogleFile({ req, file, apiKey }) {
  const fileManager = new GoogleAIFileManager(apiKey);

  const uploadResponse = await fileManager.uploadFile(file.path, {
    mimeType: file.mimetype,
    displayName: file.originalname,
  });

  const { file: uploadedFile } = uploadResponse;
  logger.debug(
    `[uploadGoogleFile] User ${req.user.id} successfully uploaded file to Google`,
    uploadedFile,
  );

  let fileInfo = await fileManager.getFile(uploadedFile.name);
  let attempts = 0;
  const maxAttempts = 10;

  while (fileInfo.state === FileState.PROCESSING && attempts < maxAttempts) {
    logger.debug(`[uploadGoogleFile] File ${uploadedFile.name} is still processing...`);
    await sleep(2000);
    fileInfo = await fileManager.getFile(uploadedFile.name);
    attempts++;
  }

  if (fileInfo.state === FileState.FAILED) {
    throw new Error('Google File API processing failed');
  }

  return {
    ...fileInfo,
    file_id: fileInfo.name, // Use the resource name as file_id
    filepath: fileInfo.uri,
  };
}

/**
 * Deletes a file from Google AI File API.
 */
async function deleteGoogleFile(req, file, apiKey) {
  try {
    const fileManager = new GoogleAIFileManager(apiKey);
    await fileManager.deleteFile(file.file_id);
    logger.debug(`[deleteGoogleFile] User ${req.user.id} deleted file ${file.file_id}`);
  } catch (error) {
    logger.error('[deleteGoogleFile] Error deleting file from Google:', error);
  }
}

module.exports = { uploadGoogleFile, deleteGoogleFile };
