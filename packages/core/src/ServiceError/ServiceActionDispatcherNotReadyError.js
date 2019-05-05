const ServiceError = require('../ServiceError')

/**
 * Error, which says that ActionDispatcher (i.e. service broker),
 * wasn't ready yet to handle this action.
 *
 * @inheritDoc
 */
class ServiceActionDispatcherNotReadyError extends ServiceError {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(body)
    this.name = 'ServiceActionDispatcherNotReadyError'
    this.code = 502
  }
}

module.exports = ServiceActionDispatcherNotReadyError
