const createServiceErrorSubClass = require('../createServiceErrorSubClass')

/**
 * Error, which says that there wasn't such action available,
 * so it could handle it.
 *
 * Error code in opposite to HTTP 404 is 400,
 * as the request itself was malformed - such API client should know about it.
 *
 * @class ServiceActionNotFoundError
 * @extends ServiceError
 */
module.exports = createServiceErrorSubClass(
  'ServiceActionNotFoundError',
  400
)
