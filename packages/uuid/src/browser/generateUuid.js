// Retrieve available Crypto API implementation
const crypto = require('./getCryptoInstance')()

// Get HEX bytes representation
const hexBytes = require('../shared/hexBytes')

// Configuration
const bufferSize = 16384

// Initialize buffer for random bytes
let buffer = new Uint8Array(bufferSize)
let bufferIndex = bufferSize

/**
 * Generate string representation of UUID v4,
 * using 'crypto' with browser-compatible API.
 *
 * @returns {number[]}
 */
module.exports = function generateUuid () {
  // When there is not enough random bytes available, rebuild buffer
  if (bufferIndex + 16 > bufferSize) {
    buffer = new Uint8Array(bufferSize)
    bufferIndex = 0
    crypto.getRandomValues(buffer)
  }

  // Build string representation of UUID v4
  const value = hexBytes[buffer[bufferIndex]] + hexBytes[buffer[bufferIndex + 1]] +
    hexBytes[buffer[bufferIndex + 2]] + hexBytes[buffer[bufferIndex + 3]] + '-' +
    hexBytes[buffer[bufferIndex + 4]] + hexBytes[buffer[bufferIndex + 5]] + '-' +
    hexBytes[(buffer[bufferIndex + 6] & 0x0f) | 0x40] + hexBytes[buffer[bufferIndex + 7]] + '-' +
    hexBytes[(buffer[bufferIndex + 8] & 0x3f) | 0x80] + hexBytes[buffer[bufferIndex + 9]] + '-' +
    hexBytes[buffer[bufferIndex + 10]] + hexBytes[buffer[bufferIndex + 11]] +
    hexBytes[buffer[bufferIndex + 12]] + hexBytes[buffer[bufferIndex + 13]] +
    hexBytes[buffer[bufferIndex + 14]] + hexBytes[buffer[bufferIndex + 15]]

  // Move buffer index to next position
  bufferIndex += 16

  return value
}
