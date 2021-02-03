const generateUuid = require('./generateUuid')
const generateBinaryUuid = require('./generateBinaryUuid')

// Expose cryptographically secure (if possible) implementation
module.exports = generateUuid
module.exports.bin = generateBinaryUuid
