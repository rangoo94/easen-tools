const deepCloneValue = require('./deepCloneValue')

/**
 * Deep-freeze and copy array.
 *
 * @param {Array} array
 * @returns {Array}
 */
function createFrozenArrayCopy (array) {
  // Freeze all elements
  const result = array.map(createFrozenCopy)

  // Freeze array itself
  Object.freeze(result)

  return result
}

/**
 * Deep-freeze and copy object.
 *
 * @param {object} object
 * @returns {object}
 */
function createFrozenObjectCopy (object) {
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

/**
 * Deep-freeze and copy object (when it's possible).
 *
 * @param {*} object
 * @returns {*}
 */
function createFrozenCopy (object) {
  // When it's not object, ignore it
  if (!object || typeof object !== 'object') {
    return object
  }

  // Deep copy object only, when freeze is not available
  if (!Object.freeze) {
    return deepCloneValue(object)
  }

  // Handle arrays and regular objects
  return Array.isArray(object)
    ? createFrozenArrayCopy(object)
    : createFrozenObjectCopy(object)
}

module.exports = createFrozenCopy
