const FunctionBuilder = require('./FunctionBuilder')

/**
 * Function builder, which helps creating action executors.
 * It has additional methods, used by action executors.
 *
 * @inheritDoc
 */
class ActionExecutorFunctionBuilder extends FunctionBuilder {
  /**
   * Handle (optional) asynchronous continuation.
   * When value is a Promise ("thenable"), you may continue using different flow.
   *
   * @param {string} value
   * @param {string} [callback]
   * @param {string} [errorHandler]
   * @param {boolean} [ensurePromiseImplementation]
   * @returns {ActionExecutorFunctionBuilder|FunctionBuilder|this}
   * @chainable
   */
  handleAsyncContinuation (value, callback, errorHandler, ensurePromiseImplementation) {
    // Ensure proper Promise implementation passed down
    const returnValue = ensurePromiseImplementation
      ? `Promise.resolve(${value})`
      : value

    return this
      .conditional(`${value} && typeof ${value}.then === "function"`)
      .open()
      .finish(
        callback
          ? errorHandler
          ? `${returnValue}.then(${callback}).catch(${errorHandler})`
          : `${returnValue}.then(${callback})`
          : returnValue
      )
      .close()
  }

  /**
   * Return value, and include current context into it.
   *
   * @param {string} code
   * @param {string} context
   * @param {string} [key]
   * @returns {ActionExecutorFunctionBuilder|FunctionBuilder|this}
   * @chainable
   */
  finishWithContext (code, context, key = 'context') {
    // Retrieve temporary variable name
    const id = this.getTemporaryVariable()

    // Attach value to temporary variable, attach context, return it
    return this.append(`
      var ${id} = ${code};
      ${id}.${key} = ${context};
      return ${id};
    `)
  }
}

module.exports = ActionExecutorFunctionBuilder
