/**
 * Mark functions as dummy functions.
 * It is used for optimizations,
 * so declared empty function may still be treat as it doesn't exist.
 *
 * @param {function} fn1
 * @param {function} [fn2]
 * @param {function} [...fns]
 * @returns {function}
 * @throws {Error}
 */
function markAsDummyFunction (/* fn1, fn2 */) {
  // Retrieve all arguments
  const fns = [].slice.call(arguments)

  // Go through all passed functions
  for (let i = 0; i < fns.length; i++) {
    // Check if it's valid function
    if (typeof fns[i] !== 'function') {
      throw new Error('Expected function to mark it as dummy.')
    }

    // Mark it as dummy
    fns[i].$dummy = true
  }

  // Return back the first one
  return fns[0]
}

/**
 * Check if function is dummy.
 *
 * @param {function} fn
 * @returns {boolean}
 */
function isDummyFunction (fn) {
  return typeof fn === 'function' && !!fn.$dummy
}

// Export data

exports.is = isDummyFunction
exports.mark = markAsDummyFunction
