const createServiceErrorSubClass = require('../createServiceErrorSubClass')

/**
 * Error, which says that the request was malformed,
 * i.e. action parameters are invalid.
 *
 * @class ServiceBadRequestError
 * @extends ServiceError
 */
module.exports = createServiceErrorSubClass(
  'ServiceBadRequestError',
  400
)
