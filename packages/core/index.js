const constants = require('./src/constants')

const ActionDispatcher = require('./src/ActionDispatcher')
const ServiceBrokerBuilder = require('./src/ServiceBrokerBuilder')
const ServiceError = require('./src/ServiceError')
const ImmediateResult = require('./src/ImmediateResult')

const annotateHandler = require('./src/utils/annotateHandler')
const mutateActionParams = require('./src/utils/mutateActionParams')

const errors = {
  ServiceActionDispatcherNotReadyError: require('./src/ServiceError/ServiceActionDispatcherNotReadyError'),
  ServiceActionForbiddenError: require('./src/ServiceError/ServiceActionForbiddenError'),
  ServiceActionNotFoundError: require('./src/ServiceError/ServiceActionNotFoundError'),
  ServiceActionUnauthorizedError: require('./src/ServiceError/ServiceActionUnauthorizedError'),
  ServiceBadRequestError: require('./src/ServiceError/ServiceBadRequestError')
}

// Export constants
exports.ActionStatus = constants.ActionStatus

// Export basic classes
exports.ActionDispatcher = ActionDispatcher
exports.ServiceBrokerBuilder = ServiceBrokerBuilder
exports.ImmediateResult = ImmediateResult

// Export errors
exports.ServiceError = ServiceError
exports.errors = errors

// Export utils
exports.annotateHandler = annotateHandler
exports.mutateActionParams = mutateActionParams
