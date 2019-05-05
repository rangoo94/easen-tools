const ServiceError = require('../ServiceError')

/**
 * Error, which says that the request was malformed,
 * i.e. action parameters are invalid.
 *
 * TODO: think how to pass here i.e. array of errors.
 *
 * @inheritDoc
 */
class ServiceBadRequestError extends ServiceError {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(body)
    this.name = 'ServiceBadRequestError'
    this.code = 400
  }
}

module.exports = ServiceBadRequestError
