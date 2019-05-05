/**
 * Prepare middleware to mutate action params.
 *
 * @param {function} fn
 * @returns {function(object): object}
 */
function mutateActionParams (fn) {
  // Validate mutating function
  if (typeof fn !== 'function') {
    throw new Error('You need to pass a function to mutate action params')
  }

  // Build wrapping function
  return actionContext => {
    actionContext.params = fn(actionContext.params)

    return actionContext
  }
}

module.exports = mutateActionParams
