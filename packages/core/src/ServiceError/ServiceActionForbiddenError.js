const createServiceErrorSubClass = require('../createServiceErrorSubClass')

/**
 * Error, which says that requested action
 * is forbidden in current context (i.e. for current user).
 *
 * @class ServiceActionForbiddenError
 * @extends ServiceError
 */
module.exports = createServiceErrorSubClass(
  'ServiceActionForbiddenError',
  403
)
