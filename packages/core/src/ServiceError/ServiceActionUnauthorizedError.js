const createServiceErrorSubClass = require('../createServiceErrorSubClass')

/**
 * Error, which says that expected action requires authorization,
 * but no valid authorization data were provided.
 *
 * @class ServiceActionUnauthorizedError
 * @extends ServiceError
 */
module.exports = createServiceErrorSubClass(
  'ServiceActionUnauthorizedError',
  401
)
