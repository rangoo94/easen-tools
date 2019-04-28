/**
 * Check if it generates unique string UUIDs.
 *
 * @param {function(): string} fn
 * @param {number} [iterations]
 * @returns {boolean}
 */
function hasUniqueStringGeneration (fn, iterations = 1e6) {
  const map = {}

  for (let i = 0; i < iterations; i++) {
    const uuid = fn()

    // It was already generated
    if (map[uuid]) {
      return false
    }

    // Save information about previous generation
    map[uuid] = true
  }

  return true
}

module.exports = hasUniqueStringGeneration
