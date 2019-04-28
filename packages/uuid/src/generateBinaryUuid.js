// Retrieve available Crypto API implementation
const crypto = require('./getCryptoInstance')()

// Configuration
const bufferSize = 16384

// Choose proper implementation for current environment.

/**
 * Generate binary representation of UUID v4.
 *
 * @type {(function(): int[])}
 */
module.exports = (function () {
  // Use cryptographically unsafe implementation, when 'crypto' is not available
  if (crypto === null) {
    return require('./generateUnsafeBinaryUuid')
  }

  // Detect 'crypto' implementation with 'getRandomValues' method (in browser),
  // or 'crypto' with 'randomBytes' method (in Node.js)
  if (typeof crypto.getRandomValues === 'function') {
    // Initialize buffer for random bytes
    let buffer
    let bufferIndex = bufferSize

    /**
     * Generate binary UUID v4,
     * using 'crypto' with browser-compatible API.
     *
     * @returns {int[]}
     */
    return function generateBinaryUuid () {
      // When there is not enough random bytes available, rebuild buffer
      if (bufferIndex + 16 > bufferSize) {
        buffer = new Uint8Array(bufferSize)
        bufferIndex = 0
        crypto.getRandomValues(buffer)
      }

      // Build array of UUID v4 bytes
      const value = [
        buffer[bufferIndex],
        buffer[bufferIndex + 1],
        buffer[bufferIndex + 2],
        buffer[bufferIndex + 3],
        buffer[bufferIndex + 4],
        buffer[bufferIndex + 5],
        (buffer[bufferIndex + 6] & 0x0f) | 0x40,
        buffer[bufferIndex + 7],
        (buffer[bufferIndex + 8] & 0x3f) | 0x80,
        buffer[bufferIndex + 9],
        buffer[bufferIndex + 10],
        buffer[bufferIndex + 11],
        buffer[bufferIndex + 12],
        buffer[bufferIndex + 13],
        buffer[bufferIndex + 14],
        buffer[bufferIndex + 15]
      ]

      // Move buffer index to next position
      bufferIndex += 16

      return value
    }
  } else if (typeof crypto.randomBytes === 'function') {
    // Initialize buffer for random bytes
    let buffer
    let bufferIndex = bufferSize

    /**
     * Generate binary UUID v4,
     * using 'crypto' with Node-compatible API.
     *
     * @returns {int[]}
     */
    return function generateBinaryUuid () {
      // When there is not enough random bytes available, rebuild buffer
      if (bufferIndex + 16 > bufferSize) {
        buffer = crypto.randomBytes(bufferSize)
        bufferIndex = 0
      }

      // Build array of UUID v4 bytes
      const value = [
        buffer[bufferIndex],
        buffer[bufferIndex + 1],
        buffer[bufferIndex + 2],
        buffer[bufferIndex + 3],
        buffer[bufferIndex + 4],
        buffer[bufferIndex + 5],
        (buffer[bufferIndex + 6] & 0x0f) | 0x40,
        buffer[bufferIndex + 7],
        (buffer[bufferIndex + 8] & 0x3f) | 0x80,
        buffer[bufferIndex + 9],
        buffer[bufferIndex + 10],
        buffer[bufferIndex + 11],
        buffer[bufferIndex + 12],
        buffer[bufferIndex + 13],
        buffer[bufferIndex + 14],
        buffer[bufferIndex + 15]
      ]

      // Move buffer index to next position
      bufferIndex += 16

      return value
    }
  } else {
    // Crypto is available, but has invalid implementation
    return require('./generateUnsafeBinaryUuid')
  }
})()
