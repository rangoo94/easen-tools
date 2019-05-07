const ActionDispatcher = require('./ActionDispatcher')
const ServiceBrokerClientAggregator = require('./ServiceBrokerClientAggregator')
const ServiceBrokerLocalClient = require('./ServiceBrokerLocalClient')
const parseServiceBrokerComponents = require('./internal/parseServiceBrokerComponents')

// Set-up default options for ServiceBroker

const defaultOptions = {}

/**
 * Just a basic service broker.
 * It is responsible for low-level service action dispatching.
 *
 * @class
 */
class ServiceBroker extends ActionDispatcher {
  /**
   * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} processors
   * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} negotiators
   * @param {Array<{ handler: function, annotations: object, expression: RegExp }>} executors
   * @param {Array<{ name: string, handler: function, annotations: object }>} actions
   * @param {object} [options]
   * @param {function|{ reject: function }} [options.Promise]
   * @param {function|boolean|string} [options.buildUuid]  or false or "none"
   * @param {function} [options.getMicroTime]
   * @param {string} [options.trackTime] may be "all", "start-only", "end-only" or "none"
   * @param {string[]|boolean|string} [options.emitActionEvents] may be "none" (false) or "all" (true)
   */
  constructor (processors, negotiators, executors, actions, options) {
    // Build options
    options = Object.assign({}, defaultOptions, options)

    // Call action dispatcher
    super(options)

    // Compute all passed data
    const components = parseServiceBrokerComponents(processors, negotiators, executors, actions)

    // Put computed data into service broker
    this._processors = components.processors
    this._negotiators = components.negotiators
    this._actions = components.actions
    this._annotations = components.annotations

    // Create ServiceBrokerClientAggregator for clients
    const aggregator = this.clientAggregator = new ServiceBrokerClientAggregator(this.options)
    this.$callClient = (context, name, params) => aggregator.call(name, params, { parentUuid: context.uuid })

    // Extract 'createActionContext' from ActionDispatcher,
    // Using `super` in function body is super-slow
    this.$createActionContext = super._createActionContext
  }

  /**
   * Create action context.
   * It is basic action context creator, with client call included.
   *
   * @inheritDoc
   * @private
   */
  _createActionContext (name, params, metaData) {
    // Build basic action context
    const actionContext = this.$createActionContext(name, params, metaData)

    // Attach client caller
    actionContext.call = this.$callClient.bind(null, actionContext)

    // Return action context back
    return actionContext
  }

  /**
   * Create local client for this service broker.
   *
   * @param {object} [options]
   * @returns {ServiceBrokerLocalClient}
   */
  createLocalClient (options) {
    return new ServiceBrokerLocalClient(
      this,
      Object.assign({}, this.options, options)
    )
  }

  /**
   * Get list of actions, which may be dispatched.
   *
   * @returns {string[]}
   */
  getActionsList () {
    return Object.keys(this._actions)
  }

  /**
   * Get action annotations.
   * Remember, that value of this function shouldn't be mutated.
   *
   * @param {string} name
   * @returns {object[]}
   */
  getActionAnnotations (name) {
    return this._annotations[name] || []
  }

  /**
   * Check if action with selected name can be called.
   *
   * @param {string} name
   * @returns {boolean}
   */
  hasActionCaller (name) {
    return !!this._actions[name]
  }

  /**
   * Process action.
   *
   * @param {object} actionContext
   * @returns {*}
   * @private
   */
  _processAction (actionContext) {
    return this._processors[actionContext.name](actionContext)
  }

  /**
   * Prepare action for execution.
   *
   * @param {object} actionContext
   * @returns {*}
   * @private
   */
  _preExecuteAction (actionContext) {
    return this._negotiators[actionContext.name](actionContext)
  }

  /**
   * Execute already prepared action.
   *
   * @param {object} actionContext
   * @returns {*}
   * @private
   */
  _executeAction (actionContext) {
    return this._actions[actionContext.name](actionContext)
  }

  /**
   * Simpler version of client registration.
   * Only for IDE completion.
   *
   * @param {ActionDispatcher} client
   * @returns {ServiceBroker}
   */
  registerClient (client) {
    this.clientAggregator.register(null, client)
    return this
  }

  /**
   * Register client for external calls.
   *
   * @param {string} namespace
   * @param {ActionDispatcher} client
   * @returns {ServiceBroker}
   */
  registerClient (namespace, client) { // eslint-disable-line
    // Allow syntax without namespace
    if (!client && namespace && typeof namespace === 'object') {
      client = namespace
      namespace = null
    }

    // Validate namespace
    if (namespace !== null && typeof namespace !== 'string') {
      throw new Error('Invalid namespace passed for client.')
    }

    // Validate client
    if (!client || typeof client !== 'object') {
      throw new Error('Invalid client passed for registration.')
    }

    // Register client in aggregator
    this.clientAggregator.register(namespace, client)

    return this
  }
}

module.exports = ServiceBroker
