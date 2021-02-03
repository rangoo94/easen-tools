const generateUuid = require('./generateUnsafeUuid')
const generateBinaryUuid = require('./generateUnsafeBinaryUuid')

// Expose cryptographically secure (if possible) implementation
module.exports = generateUuid
module.exports.bin = generateBinaryUuid
