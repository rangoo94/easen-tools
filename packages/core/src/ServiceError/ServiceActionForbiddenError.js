const ServiceError = require('../ServiceError')

/**
 * Error, which says that requested action
 * is forbidden in current context (i.e. for current user).
 *
 * @inheritDoc
 */
class ServiceActionForbiddenError extends ServiceError {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(body)
    this.name = 'ServiceActionForbiddenError'
    this.code = 403
  }
}

module.exports = ServiceActionForbiddenError
