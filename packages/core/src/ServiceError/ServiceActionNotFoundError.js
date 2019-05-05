const ServiceError = require('../ServiceError')

/**
 * Error, which says that there wasn't such action available,
 * so it could handle it.
 *
 * Error code in opposite to HTTP 404 is 400,
 * as the request itself was malformed - such API client should know about it.
 *
 * @inheritDoc
 */
class ServiceActionNotFoundError extends ServiceError {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(body)
    this.name = 'ServiceActionNotFoundError'
    this.code = 400 // it's 400 Bad Request - unknown action means that there was malformed request
  }
}

module.exports = ServiceActionNotFoundError
