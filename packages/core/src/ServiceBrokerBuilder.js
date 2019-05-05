const resolveActionPatternExpression = require('./utils/resolveActionPatternExpression')
const ServiceBroker = require('./ServiceBroker')

// Set-up default options for ServiceBrokerBuilder

const defaultOptions = {}

/**
 * Class which handles calling services,
 * including whole action lifecycle.
 */
class ServiceBrokerBuilder {
  /**
   * @param {object} [options]
   * @param {function|{ reject: function }} [options.Promise]
   * @param {function|boolean|string} [options.buildUuid]  or false or "none"
   * @param {function} [options.getMicroTime]
   * @param {string} [options.includeTime] may be "all", "start-only", "end-only" or "none"
   * @param {boolean} [options.includeEndTimeForUnknownAction]
   * @param {boolean} [options.ensurePromiseImplementation]
   * @param {string[]|boolean|string} [options.emitActionEvents] may be "none" (false) or "all" (true)
   */
  constructor (options) {
    // Build options
    this.options = Object.assign({}, defaultOptions, options)

    // Preprocessors, run before dispatching action, i.e.:
    // - inject dependencies
    // - add some info to action handler
    this._processingMiddlewares = []

    // Negotiation handlers, run before action itself is executed, i.e.:
    // - do anything, what is not strictly connected to action execution
    // - authorize user
    this._negotiatingMiddlewares = []

    // Execution middlewares, run within action (before its handler), i.e.:
    // - cache data
    // NOTE: These are already included in action handlers
    this._executionMiddlewares = []

    // Action handlers, the last stage of action
    this._actions = {}

    // List of external clients to register
    this._clients = []
  }

  /**
   * Register middleware to any step.
   *
   * @param {string} type
   * @param {string} pattern
   * @param {function(object): object} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @private
   * @chainable
   */
  _registerMiddleware (type, pattern, handler, annotations) {
    // Allow middlewares without pattern passed
    if (typeof pattern === 'function') {
      annotations = handler
      handler = pattern
      pattern = '**'
    }

    // Decide where to put middleware based on its type
    const destinationMap = {
      processing: this._processingMiddlewares,
      negotiating: this._negotiatingMiddlewares,
      execution: this._executionMiddlewares
    }

    const destination = destinationMap[type]

    // Throw error, when it's unknown type
    if (!destination) {
      throw new Error('Unknown middleware type passed to ServiceBrokerBuilder.')
    }

    // Validate annotations
    if (annotations && typeof annotations !== 'object') {
      throw new Error('Annotations passed to middleware should be an object.')
    }

    // Build regular expression based on middleware pattern
    const expression = resolveActionPatternExpression(pattern)

    // Register middleware
    destination.push({
      pattern: pattern,
      expression: expression,
      handler: handler,
      annotations: Object.assign({}, handler.$annotations, annotations)
    })

    return this
  }

  /**
   * Register "preprocessor".
   * This method is only to declare it for IDE.
   *
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerProcessingMiddleware (handler, annotations) {
    return this._registerMiddleware('processing', '**', handler, annotations)
  }

  /**
   * Register "negotiating middleware".
   * This method is only to declare it for IDE.
   *
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerNegotiatingMiddleware (handler, annotations) {
    return this._registerMiddleware('negotiating', '**', handler, annotations)
  }

  /**
   * Register "execution middleware".
   * This method is only to declare it for IDE.
   *
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerExecutionMiddleware (handler, annotations) {
    return this._registerMiddleware('execution', '**', handler, annotations)
  }

  /**
   * Register "preprocessor".
   *
   * @param {string} pattern
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerProcessingMiddleware (pattern, handler, annotations) {
    return this._registerMiddleware('processing', pattern, handler, annotations)
  }

  /**
   * Register "negotiating middleware".
   *
   * @param {string} pattern
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerNegotiatingMiddleware (pattern, handler, annotations) {
    return this._registerMiddleware('negotiating', pattern, handler, annotations)
  }

  /**
   * Register "execution middleware".
   *
   * @param {string} pattern
   * @param {function} handler
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerExecutionMiddleware (pattern, handler, annotations) {
    return this._registerMiddleware('execution', pattern, handler, annotations)
  }

  /**
   * Register final action handler.
   *
   * @param {string} name
   * @param {function} handler
   * @param {object} [handler.$annotations]
   * @param {object} [annotations]
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerAction (name, handler, annotations) {
    // Validate action name
    if (typeof name !== 'string' || name === '' || name.indexOf('*') !== -1 || /(^:|:$)/.test(name)) {
      throw new Error('Invalid action name.')
    }

    // Validate handler
    if (typeof handler !== 'function') {
      throw new Error('You need to pass handling function for action.')
    }

    // Combine all meta data
    annotations = Object.assign({}, handler.$annotations, annotations)

    // Register action in store
    this._actions[name] = {
      handler: handler,
      annotations: annotations
    }

    return this
  }

  /**
   * Only for IDE detection.
   *
   * @param {ActionDispatcher} client
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerClient (client) {
    this._clients.push({
      namespace: null,
      client: client
    })

    return this
  }

  /**
   * Register external actions client.
   *
   * @param {string|null} namespace
   * @param {ActionDispatcher} client
   * @returns {ServiceBrokerBuilder|this}
   * @chainable
   */
  registerClient (namespace, client) {
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

    // Register client
    this._clients.push({
      namespace: namespace,
      client: client
    })

    return this
  }

  /**
   * Prepare service broker for use.
   *
   * @returns {ServiceBroker}
   */
  createBroker (options) {
    options = Object.assign({}, this.options, options)

    // Build list of action definitions
    const actionsList = Object.keys(this._actions).map(name => Object.assign(
      {},
      this._actions[name],
      { name: name }
    ))

    // Initialize service broker
    const serviceBroker = new ServiceBroker(
      this._processingMiddlewares.slice(),
      this._negotiatingMiddlewares.slice(),
      this._executionMiddlewares.slice(),
      actionsList,
      options
    )

    // Register all expected clients
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i]
      serviceBroker.registerClient(client.namespace, client.client)
    }

    return serviceBroker
  }
}

module.exports = ServiceBrokerBuilder
