const ActionDispatcher = require('./ActionDispatcher')
const deepCloneValue = require('./utils/deepCloneValue')

// Set-up default options for local client

const defaultOptions = {
  deepCloneValue: deepCloneValue,
  passUuidDown: false,
  passMetaDataDown: true
}

// Set-up helper functions

/**
 * Normalize local client.
 *
 * @param {object} options
 * @param {function} [options.deepCloneValue]
 * @param {boolean} [options.passUuidDown]
 * @param {boolean} [options.passMetaDataDown]
 */
function normalizeServiceBrokerLocalClientOptions (options) {
  // Ensure that deep-clone function exists
  if (!options.deepCloneValue) {
    options.deepCloneValue = x => x
  }

  // Cast 'passUuidDown' option to boolean
  options.passUuidDown = !!options.passUuidDown

  // Cast 'passMetaDataDown' option to boolean
  options.passMetaDataDown = !!options.passMetaDataDown
}

/**
 * Basic class for calling service broker.
 *
 * @class
 */
class ServiceBrokerLocalClient extends ActionDispatcher {
  /**
   * @param {ServiceBroker} broker
   * @param {object} [options]
   * @param {boolean} [options.passUuidDown]
   * @param {boolean} [options.passMetaDataDown]
   * @param {boolean} [options.emitEvents]
   * @param {boolean} [options.includeEndTime]
   * @param {boolean} [options.includeEndTimeForUnknownAction]
   * @param {function|{ resolve: function }} [options.Promise]
   * @param {boolean|function(): *} [options.generateUuid]  or false
   * @param {boolean|function(): number} [options.getMicroTime]  or false
   * @param {boolean|function(*): *} [options.deepCloneValue]  or false
   */
  constructor (broker, options) {
    // Initialize options
    options = Object.assign({}, defaultOptions, options)

    // Normalize options
    normalizeServiceBrokerLocalClientOptions(options)

    // Call ActionDispatcher constructor
    super(options)

    // Set up broker
    this.broker = broker

    // Extract options
    this.$deepCloneValue = options.deepCloneValue
    this.$passUuidDown = options.passUuidDown
    this.$passMetaDataDown = options.passMetaDataDown
  }

  /**
   * Get list of available actions.
   *
   * @returns {string[]}
   */
  getActionsList () {
    return this.broker.getActionsList()
  }

  /**
   * Check if action with selected name can be called.
   *
   * @param {string} name
   * @returns {boolean}
   */
  hasActionCaller (name) {
    return this.broker.hasActionCaller(name)
  }

  /**
   * Execute already prepared action.
   *
   * @param {object} actionContext
   * @returns {Promise<*,*>}
   * @private
   */
  _executeAction (actionContext) {
    // Build params
    const params = this.$deepCloneValue(actionContext.params || {})

    // Create object for additional meta data
    const additionalMetaData = {}

    // Decide how to pass UUID in meta data
    if (this.$passUuidDown) {
      additionalMetaData.uuid = actionContext.uuid
      additionalMetaData.parentUuid = actionContext.parentUuid
    } else {
      additionalMetaData.parentUuid = actionContext.uuid
    }

    // Build final metadata
    const metaData = this.$passMetaDataDown
      ? Object.assign({}, actionContext.metaData, additionalMetaData)
      : Object.assign({}, additionalMetaData)

    // Create request to service broker
    return this.broker.call(actionContext.name, params, metaData)
  }
}

module.exports = ServiceBrokerLocalClient
