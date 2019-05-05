/**
 * Copy value.
 * Optimized for single level objects,
 * as it's probably most often happening case.
 *
 * @param {*} initialValue
 * @returns {*}
 */
function deepCloneValue (initialValue) {
  // Return back value which is not an object
  if (!initialValue || typeof initialValue !== 'object') {
    return initialValue
  }

  // Copy array correctly
  if (Array.isArray(initialValue)) {
    const result = new Array(initialValue.length)

    for (let i = 0; i < initialValue.length; i++) {
      result[i] = deepCloneValue(initialValue[i])
    }

    return result
  }

  // Prepare new object
  const result = {}

  // Go through all keys inside
  for (const key in initialValue) {
    // Ignore not own keys
    if (!initialValue.hasOwnProperty(key)) {
      continue
    }

    // Get initial value
    const entryValue = initialValue[key]

    // Copy value
    result[key] = typeof entryValue === 'object' && entryValue
      ? JSON.parse(JSON.stringify(entryValue))
      : entryValue
  }

  return result
}

module.exports = deepCloneValue
