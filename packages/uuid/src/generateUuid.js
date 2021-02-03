// Retrieve available Crypto API implementation
const crypto = require('./getCryptoInstance')()

// Get HEX bytes representation
const hexBytes = require('./hexBytes')

// Configuration
const bufferSize = 16384

// Choose proper implementation for current environment.

/**
 * Generate string representation of UUID v4.
 *
 * @type {(function(): string)}
 */
module.exports = (function () {
  // Use cryptographically unsafe implementation, when 'crypto' is not available
  if (crypto === null) {
    return require('./generateUnsafeUuid')
  }

  // Detect 'crypto' implementation with 'getRandomValues' method (in browser),
  // or 'crypto' with 'randomBytes' method (in Node.js)
  if (crypto.getRandomValues) {
    // Initialize buffer for random bytes
    let buffer
    let bufferIndex = bufferSize

    /**
     * Generate string representation of UUID v4,
     * using 'crypto' with browser-compatible API.
     *
     * @returns {number[]}
     */
    return function generateUuid () {
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
  } else if (crypto.randomBytes) {
    // Initialize buffer for random bytes
    let buffer
    let bufferIndex = bufferSize
    const get = () => {
      if (bufferIndex + 16 > bufferSize) {
        buffer = crypto.randomBytes(bufferSize)
        bufferIndex = 0
      }
      const next = buffer.slice(bufferIndex, bufferIndex + 16)
      bufferIndex += 16
      return next
    }

    /**
     * Generate string representation of UUID v4,
     * using 'crypto' with Node-compatible API.
     *
     * @returns {string}
     */
    return function generateUuid () {
      // Get current slice of buffers
      const buf = get()

      // Build array of UUID v4 bytes
      return hexBytes[buf[0]] + hexBytes[buf[1]] +
        hexBytes[buf[2]] + hexBytes[buf[3]] + '-' +
        hexBytes[buf[4]] + hexBytes[buf[5]] + '-' +
        hexBytes[(buf[6] & 0x0f) | 0x40] + hexBytes[buf[7]] + '-' +
        hexBytes[(buf[8] & 0x3f) | 0x80] + hexBytes[buf[9]] + '-' +
        hexBytes[buf[10]] + hexBytes[buf[11]] +
        hexBytes[buf[12]] + hexBytes[buf[13]] +
        hexBytes[buf[14]] + hexBytes[buf[15]]
    }
  } else {
    // Crypto is available, but has invalid implementation
    return require('./generateUnsafeUuid')
  }
})()
