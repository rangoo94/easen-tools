const ServiceError = require('../ServiceError')

/**
 * Error, which says that expected action requires authorization,
 * but no valid authorization data were provided.
 *
 * @inheritDoc
 */
class ServiceActionUnauthorizedError extends ServiceError {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(body)
    this.name = 'ServiceActionUnauthorizedError'
    this.code = 401
  }
}

module.exports = ServiceActionUnauthorizedError
