const convertBinaryUuidToString = require('../shared/convertBinaryUuidToString')
const generateBinaryUuid = require('./generateUnsafeBinaryUuid')

/**
 * Generate unsafe UUID v4.
 * This function is using Math.random for randomness,
 * which is not cryptographically secure, but fast.
 *
 * @returns {string}
 */
function generateUnsafeUuid () {
  return convertBinaryUuidToString(generateBinaryUuid())
}

module.exports = generateUnsafeUuid
