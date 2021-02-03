const convertBinaryUuidToString = require('../shared/convertBinaryUuidToString')
const generateBinaryUuid = require('./generateBinaryUuid')

/**
 * Generate string representation of UUID v4,
 * using 'crypto' with Node-compatible API.
 *
 * @returns {string}
 */
function generateUuid () {
  return convertBinaryUuidToString(generateBinaryUuid())
}

module.exports = generateUuid
