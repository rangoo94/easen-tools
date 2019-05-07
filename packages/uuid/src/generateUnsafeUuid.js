const hexBytes = require('./hexBytes')

/**
 * Generate unsafe UUID v4.
 * This function is using Math.random for randomness,
 * which is not cryptographically secure, but fast.
 *
 * Based on Moleculer embedded implementation.
 * @see https://github.com/moleculerjs/moleculer/blob/aab42e5accd3dded86e1dc341ab819f952fec378/src/utils.js#L37
 *
 * @returns {string}
 */
function generateUnsafeUuid () {
  const d0 = Math.random() * 0xffffffff
  const d1 = Math.random() * 0xffffffff
  const d2 = Math.random() * 0xffffffff
  const d3 = Math.random() * 0xffffffff

  return hexBytes[d0 & 0xff] + hexBytes[d0 >> 8 & 0xff] + hexBytes[d0 >> 16 & 0xff] + hexBytes[d0 >> 24 & 0xff] + '-' +
    hexBytes[d1 & 0xff] + hexBytes[d1 >> 8 & 0xff] + '-' +
    hexBytes[d1 >> 16 & 0x0f | 0x40] + hexBytes[d1 >> 24 & 0xff] + '-' +
    hexBytes[d2 & 0x3f | 0x80] + hexBytes[d2 >> 8 & 0xff] + '-' +
    hexBytes[d2 >> 16 & 0xff] + hexBytes[d2 >> 24 & 0xff] +
    hexBytes[d3 & 0xff] + hexBytes[d3 >> 8 & 0xff] + hexBytes[d3 >> 16 & 0xff] + hexBytes[d3 >> 24 & 0xff]
}

module.exports = generateUnsafeUuid
