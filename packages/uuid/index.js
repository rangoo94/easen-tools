const isValidUuid = require('./src/isValidUuid')

const nodeCrypto = (function () {
  try {
    return require('cr' + 'ypto')
  } catch (e) {
    return null
  }
}())

// Test if string is valid UUID v4
exports.test = isValidUuid

// Expose cryptographically secure (if possible) implementation
if (typeof window !== 'undefined' && (typeof crypto !== 'undefined' || typeof msCrypto !== 'undefined')) {
  exports.generate = require('./src/browser')
} else if (typeof global !== 'undefined' && nodeCrypto !== null) {
  exports.generate = require('./src/node')
} else {
  exports.generate = require('./src/unsafe')
}

// Expose cryptographically unsafe implementation
exports.generateUnsafe = require('./src/unsafe')
