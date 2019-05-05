/**
 * Extend annotations attached to handler.
 *
 * @param {function} fn
 * @param {object} annotations
 * @param {boolean} [shouldReplace]
 * @returns {function}
 */
function annotateHandler (fn, annotations, shouldReplace) {
  // Validate if it is a function
  if (typeof fn !== 'function') {
    throw new Error('You can\'t annotate handler which is not a function')
  }

  // Do not update handler if there are no annotations
  if (!annotations || Object.keys(annotations).length === 0) {
    return fn
  }

  // Create new function, so it will not mutate anything
  const wrappedFn = function annotatedActionHandler () {
    return fn.apply(null, arguments)
  }

  // Attach annotations to function, eventually reusing old annotations
  if (shouldReplace) {
    wrappedFn.$annotations = Object.assign({}, annotations)
  } else {
    wrappedFn.$annotations = Object.assign({}, fn.$annotations, annotations)
  }

  return wrappedFn
}

module.exports = annotateHandler
