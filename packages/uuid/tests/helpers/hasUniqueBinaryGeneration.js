/**
 * Serialize binary array to string.
 *
 * @param {number[]} arr
 * @returns {string}
 */
function serializeBinaryArray (arr) {
  return [].join.call(arr, ',')
}

/**
 * Check if it generates unique binary UUIDs.
 *
 * @param {function(): number[]} fn
 * @param {number} [iterations]
 * @returns {boolean}
 */
function hasUniqueBinaryGeneration (fn, iterations = 1e5) {
  const map = {}

  for (let i = 0; i < iterations; i++) {
    const uuid = serializeBinaryArray(fn())

    // It was already generated
    if (map[uuid]) {
      return false
    }

    // Save information about previous generation
    map[uuid] = true
  }

  return true
}

module.exports = hasUniqueBinaryGeneration
