const ActionDispatcher = require('./ActionDispatcher')
const deepCloneValue = require('./utils/deepCloneValue')

const defaultOptions = {
  deepCloneValue: deepCloneValue,
  passUuidDown: false
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

    // Call ActionDispatcher constructor
    super(options)

    // Set up broker
    this.broker = broker

    // Extract options
    this._deepCloneValue = options.deepCloneValue || (x => x)
    this._passUuidDown = !!options.passUuidDown
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
    const params = this._deepCloneValue(actionContext.params || {})

    // Create object for additional meta data
    const additionalMetaData = {}

    // Decide how to pass UUID in meta data
    if (this._passUuidDown) {
      additionalMetaData.uuid = actionContext.uuid
      additionalMetaData.parentUuid = actionContext.parentUuid
    } else {
      additionalMetaData.parentUuid = actionContext.uuid
    }

    // Build final metadata
    const metaData = Object.assign({}, actionContext.metaData, additionalMetaData)

    // Create request to service broker
    return this.broker.call(actionContext.name, params, metaData)
  }
}

module.exports = ServiceBrokerLocalClient
