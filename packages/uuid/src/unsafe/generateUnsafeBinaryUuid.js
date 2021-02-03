/**
 * Generate unsafe binary UUID v4.
 * This function is using Math.random for randomness,
 * which is not cryptographically secure, but fast.
 *
 * @returns {int[]}
 */
function generateUnsafeBinaryUuid () {
  const d0 = Math.random() * 0xffffffff
  const d1 = Math.random() * 0xffffffff
  const d2 = Math.random() * 0xffffffff
  const d3 = Math.random() * 0xffffffff

  return [
    d0 & 0xff,
    d0 >> 8 & 0xff,
    d0 >> 16 & 0xff,
    d0 >> 24 & 0xff,
    d1 & 0xff,
    d1 >> 8 & 0xff,
    d1 >> 16 & 0x0f | 0x40,
    d1 >> 24 & 0xff,
    d2 & 0x3f | 0x80,
    d2 >> 8 & 0xff,
    d2 >> 16 & 0xff,
    d2 >> 24 & 0xff,
    d3 & 0xff,
    d3 >> 8 & 0xff,
    d3 >> 16 & 0xff,
    d3 >> 24 & 0xff
  ]
}

module.exports = generateUnsafeBinaryUuid
