const ActionDispatcher = require('./ActionDispatcher')
const deepCloneValue = require('./utils/deepCloneValue')
const buildChainedFunction = require('./utils/buildChainedFunction')

const ServiceActionDispatcherNotReadyError = require('./ServiceError/ServiceActionDispatcherNotReadyError')
const ServiceActionNotFoundError = require('./ServiceError/ServiceActionNotFoundError')

const defaultOptions = {
  deepCloneValue: deepCloneValue,
  passUuidDown: false
}

/**
 * Basic class for calling service broker.
 *
 * @class
 */
class ServiceBrokerLocalTransparentClient extends ActionDispatcher {
  /**
   * @param {ServiceBroker} broker
   * @param {object} [options]
   * @param {function|{ resolve: function }} [options.Promise]
   * @param {boolean|function(*): *} [options.deepCloneValue]  or false
   */
  constructor (broker, options) {
    // Initialize options
    options = Object.assign({}, defaultOptions, options, {
      emitEvents: false,
      generateUuid: false,
      getMicroTime: false
    })

    // Call ActionDispatcher constructor
    super(options)

    // Set up broker
    this.broker = broker

    // Extract options
    this._deepCloneValue = options.deepCloneValue || (x => x)

    // Build simplified access function
    this._chainedFn = buildChainedFunction([
      broker._processAction.bind(broker),
      broker._preExecuteAction.bind(broker),
      broker._executeAction.bind(broker)
    ])
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
   * Dispatch action, going through whole flow of data.
   *
   * @param {string} name
   * @param {object} [params]
   * @param {object} [metaData]
   * @returns {Promise<*,*>}
   * @final
   */
  call (name, params, metaData) {
    // Set up parameters
    if (params == null) {
      params = {}
    }

    // Set up meta-data
    if (typeof metaData !== 'object') {
      metaData = {}
    }

    let initialActionContext

    try {
      // Check if action dispatcher is ready
      if (!this.isReady()) {
        return this.Promise.reject(new ServiceActionDispatcherNotReadyError('ActionDispatcher is not ready yet.'))
      }

      // Prepare basic action context
      initialActionContext = this.broker._createActionContext(name, params, metaData)

      // Validate action
      if (!this.hasActionCaller(initialActionContext.name)) {
        // Reject call
        return this.Promise.reject(new ServiceActionNotFoundError('Action not found.'))
      }
    } catch (error) {
      // Throw back error
      return this.Promise.reject(error)
    }

    let finalActionContext = initialActionContext

    try {
      const processedActionContext = this.broker._processAction(initialActionContext)
    } catch (error) {
      // if (error.$immediateResult)
    }

    // Process action
    return new this.Promise(dispatchAction.bind(null, this, initialActionContext))
  }
}

module.exports = ServiceBrokerLocalTransparentClient
