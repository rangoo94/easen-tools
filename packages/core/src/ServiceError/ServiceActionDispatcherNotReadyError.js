const createServiceErrorSubClass = require('../createServiceErrorSubClass')

/**
 * Error, which says that ActionDispatcher (i.e. service broker),
 * wasn't ready yet to handle this action.
 *
 *
 * @class ServiceActionDispatcherNotReadyError
 * @extends ServiceError
 */
module.exports = createServiceErrorSubClass(
  'ServiceActionDispatcherNotReadyError',
  502
)
