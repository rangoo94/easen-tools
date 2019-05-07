const ActionDispatcher = require('./ActionDispatcher')
const ServiceActionNotFoundError = require('./ServiceError/ServiceActionNotFoundError')

const defaultOptions = {
  Promise: Promise
}

/**
 * Manager for using multiple service broker clients.
 *
 * TODO: it should extend ServiceBrokerClient
 *
 * @class
 */
class ServiceBrokerClientAggregator extends ActionDispatcher {
  /**
   * @param {object} [options]
   * @param {object|function} [options.Promise]
   */
  constructor (options) {
    // Build options
    options = Object.assign({}, defaultOptions, options)

    // Call ActionDispatcher
    super(options)

    // Create place for actions
    this._actions = {}
    this._annotations = {}
    this._clients = []
  }

  /**
   * Check if all attached dispatchers are ready.
   *
   * @returns {boolean}
   * @inheritDoc
   */
  isReady () {
    for (let i = 0; i < this._clients.length; i++) {
      if (!this._clients[i].isReady()) {
        return false
      }
    }

    return true
  }

  /**
   * Check if all attached dispatchers are healthy.
   *
   * @returns {boolean}
   * @inheritDoc
   */
  isHealthy () {
    for (let i = 0; i < this._clients.length; i++) {
      if (!this._clients[i].isHealthy()) {
        return false
      }
    }

    return true
  }

  /**
   * Check if there is action available.
   *
   * @param {string} name
   * @returns {boolean}
   * @inheritDoc
   */
  hasActionCaller (name) {
    return !!this._actions[name]
  }

  /**
   * Register new client inside.
   *
   * @param {string|null} namespace
   * @param {ActionDispatcher} client
   * @returns {ServiceBrokerClientAggregator}
   */
  register (namespace, client) {
    // Add new client
    this._clients.push({
      namespace: namespace,
      client: client
    })

    // Rebuild all meta-data and actions
    this.$rebuild()

    return this
  }

  /**
   * Rebuild current actions mapping.
   *
   * @private
   */
  $rebuild () {
    // Reset actions mapping
    this._actions = {}
    this._annotations = {}

    // Iterate over all clients, searching for actions
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i].client
      const namespace = this._clients[i].namespace

      const actionPrefix = namespace ? `${namespace}.` : ''
      const actions = client.getActionsList()

      // Iterate over all actions available within client
      for (let j = 0; j < actions.length; j++) {
        const annotations = client.getActionAnnotations ? client.getActionAnnotations(actions[j]) : []
        this.$registerAction(actionPrefix, actions[j], client, annotations)
      }
    }
  }

  /**
   * Register action, so it will be available for call.
   *
   * @param {string} prefix
   * @param {string} name
   * @param {ActionDispatcher} client
   * @param {object} [annotations]
   * @private
   */
  $registerAction (prefix, name, client, annotations) {
    const alias = prefix + name

    this._actions[alias] = client.call.bind(client, name)
    this._annotations[alias] = annotations || {}
  }

  /**
   * Dispatch selected action on client which is responsible for it.
   *
   * @param {string} name
   * @param {object} [params]
   * @param {object} [metaData]
   * @returns {Promise}
   */
  call (name, params, metaData) {
    // Retrieve action caller
    const call = this._actions[name]

    // Deny call with unknown action
    if (!call) {
      return this.$Promise.reject(new ServiceActionNotFoundError('Action not found.'))
    }

    // Pass to selected client
    return call(params, metaData)
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
   * Get list of available actions.
   *
   * @returns {string[]}
   */
  getActionsList () {
    return Object.keys(this._actions)
  }
}

module.exports = ServiceBrokerClientAggregator
