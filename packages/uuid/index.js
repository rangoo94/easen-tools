const generateUnsafeUuid = require('./src/generateUnsafeUuid')
const generateUnsafeBinaryUuid = require('./src/generateUnsafeBinaryUuid')
const generateUuid = require('./src/generateUuid')
const generateBinaryUuid = require('./src/generateBinaryUuid')
const isValidUuid = require('./src/isValidUuid')

// Test if string is valid UUID v4
exports.test = isValidUuid

// Expose cryptographically secure (if possible) implementation
exports.generate = generateUuid
exports.generate.bin = generateBinaryUuid

// Expose cryptographically unsafe implementation
exports.generateUnsafe = generateUnsafeUuid
exports.generateUnsafe.bin = generateUnsafeBinaryUuid
