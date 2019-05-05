const deepCloneValue = require('./deepCloneValue')

/**
 * Deep-freeze and copy object (when it's possible).
 *
 * @param {*} object
 * @returns {*}
 */
function createFrozenCopy (object) {
  // Deep copy object only, when freeze is not available
  if (!Object.freeze) {
    return deepCloneValue(object)
  }

  // When it's not object, ignore it
  if (!object || typeof object !== 'object') {
    return object
  }

  // Handle array as well
  if (Array.isArray(object)) {
    // Freeze all elements
    const result = object.map(createFrozenCopy)

    // Freeze array itself
    Object.freeze(result)

    return result
  }

  // Initiate result object
  const result = {}

  // Iterate over original keys to freeze them in copy
  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      result[key] = createFrozenCopy(object[key])
    }
  }

  // Freeze result object itself
  Object.freeze(result)

  return result
}

module.exports = createFrozenCopy
