const buildChainedFunction = require('../utils/buildChainedFunction')
const createFrozenCopy = require('../utils/createFrozenCopy')

/**
 * Check if selected service broker component is valid.
 * These components will be used for preparing service broker mechanisms.
 *
 * @param {object} component
 * @param {boolean} [shouldHaveExpression]
 * @param {boolean} [shouldHaveName]
 * @returns {boolean}
 * @see {isServiceBrokerComponentsListValid}
 * @see {parseServiceBrokerComponents}
 */
function isServiceBrokerComponentValid (component, shouldHaveExpression, shouldHaveName) {
  // It should be an object
  if (!component || typeof component !== 'object') {
    return false
  }

  // It should have 'handler' function
  if (!component.handler || typeof component.handler !== 'function') {
    return false
  }

  // It should have map of annotations
  if (!component.annotations || typeof component.annotations !== 'object') {
    return false
  }

  // It should have 'name' if it's expected
  if (shouldHaveName && (!component.name || typeof component.name !== 'string')) {
    return false
  }

  // It should have regular expression if it's expected
  if (shouldHaveExpression && (!component.expression || typeof component.expression.test !== 'function')) {
    return false
  }

  return true
}

/**
 * Check if list of service broker components is valid.
 * These components will be used for preparing service broker mechanisms.
 *
 * @param {object[]} componentsList
 * @param {boolean} [shouldHaveExpression]
 * @param {boolean} [shouldHaveName]
 * @returns {boolean}
 * @see {isServiceBrokerComponentsListValid}
 * @see {parseServiceBrokerComponents}
 */
function isServiceBrokerComponentsListValid (componentsList, shouldHaveExpression, shouldHaveName) {
  // It should be an array
  if (!Array.isArray(componentsList)) {
    return false
  }

  // Iterate over components to validate each of them
  for (let i = 0; i < componentsList.length; i++) {
    const component = componentsList[i]

    if (!isServiceBrokerComponentValid(component, shouldHaveExpression, shouldHaveName)) {
      return false
    }
  }

  return true
}

/**
 * Validate service broker components,
 * and throw error when something is invalid.
 *
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} processors
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} negotiators
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} executors
 * @param {Array<{ name: string, handler: function, annotations: object }>} actions
 * @throws {Error}
 */
function validateServiceBrokerComponents (processors, negotiators, executors, actions) {
  // Validate pre-processors list
  if (!isServiceBrokerComponentsListValid(processors, true)) {
    throw new Error('Invalid pre-processors list passed to ServiceBroker.')
  }

  // Validate negotiators list
  if (!isServiceBrokerComponentsListValid(negotiators, true)) {
    throw new Error('Invalid negotiators list passed to ServiceBroker.')
  }

  // Validate executors list
  if (!isServiceBrokerComponentsListValid(executors, true)) {
    throw new Error('Invalid executors list passed to ServiceBroker.')
  }

  // Validate actions list
  if (!isServiceBrokerComponentsListValid(actions, false, true)) {
    throw new Error('Invalid actions list passed to ServiceBroker.')
  }
}

/**
 * Parse all service broker components,
 * so it will have everything extracted and prepared for use.
 *
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} processors
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} negotiators
 * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} executors
 * @param {Array<{ name: string, handler: function, annotations: object }>} actions
 * @returns {{ annotations: object, processors: object, actions: object, negotiators: object }}
 */
function parseServiceBrokerComponents (processors, negotiators, executors, actions) {
  // Validate passed arguments
  validateServiceBrokerComponents(processors, negotiators, executors, actions)

  // Initialize empty object with data
  const result = {
    processors: {},
    negotiators: {},
    actions: {},
    annotations: {}
  }

  // Iterate over all actions to build parts for them
  for (let i = 0; i < actions.length; i++) {
    // Retrieve action itself
    const action = actions[i]

    // Retrieve all data connected to this action
    const actionProcessors = processors.filter(x => x.expression.test(action.name))
    const actionNegotiators = negotiators.filter(x => x.expression.test(action.name))
    const actionExecutors = executors.filter(x => x.expression.test(action.name))

    // Find all annotations (ignore empty annotations, except final action handler),
    // and put them in result
    result.annotations[action.name] = [].concat(actionProcessors, actionNegotiators, actionExecutors)
      .map(x => x.annotations)
      .filter(x => Object.keys(x).length > 0)
      .concat(action.annotations)

    // Combine all parts into single functions
    result.processors[action.name] = buildChainedFunction(actionProcessors.map(x => x.handler), 1)
    result.negotiators[action.name] = buildChainedFunction(actionNegotiators.map(x => x.handler), 1)
    result.actions[action.name] = buildChainedFunction(actionExecutors.concat(action).map(x => x.handler), 1)
  }

  // Freeze result object, so nothing will be changed here
  createFrozenCopy(result)

  // Return final definition
  return result
}

module.exports = parseServiceBrokerComponents
