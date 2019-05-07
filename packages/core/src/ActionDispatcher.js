const EventEmitter = require('events').EventEmitter

const { ActionStatus, ActionEventByStatus } = require('./constants')
const defaults = require('./defaults')

const createActionExecutor = require('./internal/createActionExecutor')
const ServiceActionDispatcherNotReadyError = require('./ServiceError/ServiceActionDispatcherNotReadyError')
const createSimpleMapAccessFunction = require('./utils/createSimpleMapAccessFunction')
const dummyFunctions = require('./utils/dummyFunctions')

// Build list of all action event types

const ACTION_EVENT_TYPES = Object.keys(ActionEventByStatus)

// Set-up default options for ActionDispatcher

const defaultOptions = {
  // Implementations
  Promise: defaults.Promise,
  buildUuid: defaults.buildUuid, // TODO: UUID validation function? for parent UUIDs.
  getMicroTime: defaults.getMicroTime,

  // Switchers
  ensurePromiseImplementation: true,
  trackTime: 'all',
  emitActionEvents: ACTION_EVENT_TYPES
}

// Create mapping for action events with default handlers

const eventHandlingMethods = {
  [ActionStatus.CREATED]: '_onActionCreated',
  [ActionStatus.UNKNOWN]: '_onActionUnknown',
  [ActionStatus.READY]: '_onActionReady',
  [ActionStatus.EXECUTION]: '_onActionExecution',
  [ActionStatus.SUCCESS]: '_onActionSuccess',
  [ActionStatus.ERROR]: '_onActionError'
}

/**
 * Validate options passed to action dispatcher.
 *
 * @param {object} options
 * @param {function|{ reject: function }} options.Promise
 * @param {function} options.buildUuid
 * @param {function} options.getMicroTime
 * @param {string} [options.trackTime] "all", "start-only", "end-only", "none"
 * @param {string[]} options.emitActionEvents
 */
function validateActionDispatcherOptions (options) {
  // Validate Promise implementation
  if (!options.Promise || typeof options.Promise !== 'function' || !options.Promise.reject || !options.Promise.resolve) {
    throw new Error('Invalid Promise implementation passed to ActionDispatcher.')
  }

  // Validate "trackTime" value
  if ([ 'all', 'none', 'start-only', 'end-only' ].indexOf(options.trackTime) === -1) {
    throw new Error('Invalid "trackTime" option passed to ActionDispatcher. Expected "all", "none", "start-only" or "end-only"')
  }

  // Validate UUID generation function
  if (typeof options.buildUuid !== 'function') {
    throw new Error('Invalid implementation of UUID generation passed to ActionDispatcher.')
  }

  // Validate micro-time function
  if (typeof options.getMicroTime !== 'function') {
    throw new Error('Invalid implementation of micro-time getter passed to ActionDispatcher.')
  }

  // Validate action events
  const eventTypes = options.emitActionEvents
  if (!Array.isArray(eventTypes) || eventTypes.filter(x => typeof x !== 'string').length > 0) {
    throw new Error('Invalid list of action events to emit.')
  }
}

/**
 * Normalize options passed to action dispatcher.
 *
 * @param {function|{ reject: function }} [options.Promise]
 * @param {function} [options.getMicroTime]
 * @param {function|boolean|string} [options.buildUuid] or "none" or false
 * @param {string} [options.trackTime]  may be "all", "start-only", "end-only", "none"
 * @param {string[]|string|boolean} [options.emitActionEvents]  may be "none" (false) or "all" (true)
 * @param {boolean} [options.ensurePromiseImplementation]
 * @returns {object}
 */
function normalizeActionDispatcherOptions (options) {
  // Make sure that it's boolean
  options.ensurePromiseImplementation = !!options.ensurePromiseImplementation

  // Build proper list of passed events
  if (options.emitActionEvents === true || options.emitActionEvents === 'all') {
    options.emitActionEvents = ACTION_EVENT_TYPES.slice()
  } else if (options.emitActionEvents === false || options.emitActionEvents === 'none') {
    options.emitActionEvents = []
  }

  // Allow "none" for buildUuid
  if (options.buildUuid === 'none') {
    options.buildUuid = false
  }

  // Make unique list of passed events
  if (Array.isArray(options.emitActionEvents)) {
    options.emitActionEvents = options.emitActionEvents.filter((x, i, arr) => arr.indexOf(x) === i)
  }

  // Allow booleans for time tracking
  if (!options.trackTime) {
    options.trackTime = 'none'
  } else if (options.trackTime === true || options.trackTime === 'both') {
    options.trackTime = 'all'
  }

  // Replace empty functions
  options.getMicroTime = options.getMicroTime || (() => null)
  options.buildUuid = options.buildUuid || (() => null)

  return options
}

/**
 * Fired after action is requested.
 *
 * @event ActionDispatcher#event:action-created
 * @param {object} actionContext
 */

/**
 * Fired when action is unknown.
 *
 * @event ActionDispatcher#event:action-unknown
 * @param {object} actionContext
 */

/**
 * Fired after action is initially processed.
 *
 * @event ActionDispatcher#event:action-ready
 * @param {object} actionContext
 * @param {object} initialActionContext
 */

/**
 * Fired when prepared action is about to be executed.
 *
 * @event ActionDispatcher#event:action-execution
 * @param {object} actionContext
 * @param {*} error
 * @param {object} initialActionContext
 */

/**
 * Fired after action has been finished successfully.
 *
 * @event ActionDispatcher#event:action-success
 * @param {object} actionContext
 * @param {*} result
 * @param {object} initialActionContext
 */

/**
 * Fired after action has failed (and it's not unknown).
 *
 * @event ActionDispatcher#event:action-error
 * @param {object} actionContext
 * @param {*} error
 * @param {object} initialActionContext
 * @see ActionDispatcher#event:action-unknown
 */

/**
 * Abstract class, which gives nice interface for dispatching actions,
 * even in multiple steps.
 *
 * @class
 * @abstract
 */
class ActionDispatcher extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {function|{ reject: function }} [options.Promise]
   * @param {function|boolean|string} [options.buildUuid]  or false or "none"
   * @param {boolean} [options.ensurePromiseImplementation]
   * @param {function} [options.getMicroTime]
   * @param {string} [options.trackTime] may be "all", "start-only", "end-only" or "none"
   * @param {string[]|boolean|string} [options.emitActionEvents] may be "none" (false) or "all" (true)
   */
  constructor (options) {
    // Attach EventEmitter
    super()

    // It should disallow constructing abstract function
    if (this.constructor === ActionDispatcher) {
      throw new Error('You can\'t create instance of abstract ActionDispatcher class.')
    }

    // Build options
    this.options = Object.assign({}, defaultOptions, options)

    // Normalize options
    this.options = normalizeActionDispatcherOptions(this.options)

    // Validate them
    validateActionDispatcherOptions(this.options)

    // Retrieve data for computation
    const getMicroTime = this.options.getMicroTime
    const trackTime = this.options.trackTime

    // Extract important options
    this.$Promise = this.options.Promise
    this.$includeStartTime = trackTime === 'all' || trackTime === 'start-only'
    this.$includeEndTime = trackTime === 'all' || trackTime === 'end-only'
    this.$getStartTime = this.$includeStartTime ? getMicroTime : () => null
    this.$getEndTime = this.$includeEndTime ? getMicroTime : () => null
    this.$buildUuid = this.options.buildUuid
  }

  /**
   * Check if action dispatcher is available for call.
   *
   * @returns {boolean}
   */
  isReady () {
    return true
  }

  /**
   * Check if action dispatcher is healthy.
   *
   * @returns {boolean}
   */
  isHealthy () {
    return this.isReady()
  }

  /**
   * Get list of actions, which may be dispatched.
   *
   * @returns {string[]}
   * @abstract
   */
  getActionsList () {
    throw new Error('You should implement getActionsList() method for ActionDispatcher.')
  }

  /**
   * Prepare action context based on input data.
   *
   * @param {string} name
   * @param {object} params
   * @param {object} metaData
   * @returns {object}
   * @private
   */
  _createActionContext (name, params, metaData) {
    // Get start time of action
    const startTime = this.$getStartTime()

    // Build action context
    return {
      Promise: this.$Promise,
      startTime: startTime,
      endTime: null,
      uuid: metaData.uuid || this.$buildUuid(),
      parentUuid: metaData.parentUuid || null,
      name: name,
      params: params,
      metaData: metaData
    }
  }

  /**
   * Check if action with selected name can be called.
   *
   * @param {string} name
   * @returns {boolean}
   * @abstract
   */
  hasActionCaller (name) {
    throw new Error('You should implement hasActionCaller() method for ActionDispatcher.')
  }

  /**
   * Initially process action.
   *
   * In example, it may include:
   * - injecting dependencies
   * - adding meta-data to action context
   *
   * @param {object} actionContext
   * @returns {Promise|void}
   * @async if needed
   * @private
   */
  _processAction (actionContext) {}

  /**
   * Prepare action for execution.
   *
   * In example, it may include:
   * - authentication & authorization
   * - anything, what is not strictly connected to action execution
   *
   * @param {object} actionContext
   * @returns {Promise|void}
   * @async if needed
   * @private
   */
  _preExecuteAction (actionContext) {}

  /**
   * Finally, execute already prepared action.
   *
   * On this layer the proper action may be executed,
   * including cache layer (as whole negotiation was already done).
   *
   * @param {object} actionContext
   * @returns {*|Promise<*,*>}
   * @async if needed
   * @abstract
   * @private
   */
  _executeAction (actionContext) {
    throw new Error('You should implement _executeAction() method for ActionDispatcher.')
  }

  /**
   * Process or modify successful result before returning it.
   *
   * @param {object} result
   * @param {object} actionContext
   * @returns {*}
   * @async if needed
   * @private
   */
  _processResult (result, actionContext) {
    return result
  }

  /**
   * Finalize action context, after it's fully executed.
   *
   * @param {object} actionContext
   * @param {*} [value]
   * @param {*} [error]
   * @private
   */
  _finalizeContext (actionContext, value, error) {
    actionContext.endTime = this.$getEndTime()
  }

  /**
   * Do something after action is requested (after `_createActionContext`).
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @see _createActionContext
   * @see call
   * @private
   */
  _onActionCreated (actionContext) {}

  /**
   * Do something after action is requested, but name is not recognized.
   * It will be fired after _onActionRequest.
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @see _createActionContext
   * @see hasActionCaller
   * @see call
   * @private
   */
  _onActionUnknown (actionContext) {}

  /**
   * Do something after action is already processed.
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @see _processAction
   * @see call
   * @private
   */
  _onActionReady (actionContext) {}

  /**
   * Do something after action is just about to be executed.
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @see _preExecuteAction
   * @see call
   * @private
   */
  _onActionExecution (actionContext) {}

  /**
   * Do something after action has been successfully executed.
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @param {*} result
   * @see _executeAction
   * @see call
   * @private
   */
  _onActionSuccess (actionContext, result) {}

  /**
   * Do something after action has failed (and it's not unknown action).
   * It's intended for side effects.
   *
   * @param {object} actionContext
   * @param {*} error
   * @see _executeAction
   * @see _onActionUnknown
   * @see call
   * @private
   */
  _onActionError (actionContext, error) {}

  /**
   * Dispatch action, going through whole flow of data.
   *
   * @param {string} name
   * @param {object} [params]
   * @param {object} [metaData]
   * @returns {Promise<*,*>|{ context: object }}
   * @fires ActionDispatcher#event:action-created
   * @fires ActionDispatcher#event:action-unknown
   * @fires ActionDispatcher#event:action-ready
   * @fires ActionDispatcher#event:action-execution
   * @fires ActionDispatcher#event:action-success
   * @fires ActionDispatcher#event:action-error
   * @final
   */
  call (name, params, metaData) {
    try {
      // Check if action dispatcher is ready
      if (!this.isReady()) {
        return this.$Promise.reject(new ServiceActionDispatcherNotReadyError('ActionDispatcher is not ready yet.'))
      }
    } catch (error) {
      // Throw back error
      return this.$Promise.reject(error)
    }

    // Set up parameters
    if (params == null) {
      params = {}
    }

    // Set up meta-data
    if (typeof metaData !== 'object') {
      metaData = {}
    }

    // Execute action internally
    return this.$getExecutor()(name, params, metaData)
  }

  /**
   * Get internal action executor instance.
   *
   * @returns {(function(string, object, object): Promise<*, *>)|{ context: object }}
   * @private
   */
  $getExecutor () {
    // Initialize executor if it's not available yet
    if (!this.$executor) {
      return this.$initializeExecutor()
    }

    return this.$executor
  }

  /**
   * Initialize internal action executor.
   *
   * @returns {(function(string, object, object): Promise<*, *>)|{ context: object }}
   * @private
   */
  $initializeExecutor () {
    // eslint-disable-next-line
    return this.$executor = createActionExecutor({
      Promise: this.$Promise,
      ensurePromiseImplementation: this.options.ensurePromiseImplementation,
      includeContext: false,
      isActionSupported: this.hasActionCaller.bind(this),
      createContext: this._createActionContext.bind(this),
      process: dummyFunctions.is(this._processAction) ? null : this._processAction.bind(this),
      preExecute: dummyFunctions.is(this._preExecuteAction) ? null : this._preExecuteAction.bind(this),
      execute: this._executeAction.bind(this),
      processResult: dummyFunctions.is(this._processResult) ? null : this._processResult.bind(this),
      finalizeContext: this._finalizeContext.bind(this),
      onActionStateChange: this.$createOnActionStateChangeHandler()
    })
  }

  /**
   * Create handler for action state change in internal action executor.
   *
   * @returns {function(string, object, [*])}
   * @private
   */
  $createOnActionStateChangeHandler () {
    // Create map of simple handlers
    const eventHandlers = {}

    // Use proper functions for event handlers
    for (const eventName in eventHandlingMethods) {
      const fnName = eventHandlingMethods[eventName]
      const handler = this[fnName]

      // Initialize handler
      eventHandlers[eventName] = dummyFunctions.is(handler) ? null : handler.bind(this)
    }

    // Get action events which may be emitted
    const emittedEvents = this.options.emitActionEvents

    // Override event handler for actions which should be emitted
    for (let i = 0; i < emittedEvents.length; i++) {
      const eventType = emittedEvents[i]
      const prevHandler = eventHandlers[eventType]

      // Build code partials
      const prevHandlerCode = prevHandler ? '$h(context, value);' : ''
      const emitCode = `$a.emit(${JSON.stringify(ActionEventByStatus[eventType])}, context, value);`

      // Build code of new handler
      const fnCode = `return function handleEvent (context, value) { ${prevHandlerCode} ${emitCode} }`

      // Create/replace handler which will emit event and call default one
      eventHandlers[eventType] = prevHandler
        ? new Function('$a', '$h', fnCode)(this, prevHandler) // eslint-disable-line no-new-func
        : new Function('$a', fnCode)(this) // eslint-disable-line no-new-func
    }

    // Check number of existing event handlers
    const eventHandlersCount = Object.keys(eventHandlers).filter(key => eventHandlers[key]).length

    // Build handler if it's needed
    return eventHandlersCount > 0
      ? createSimpleMapAccessFunction(eventHandlers, 3, 1)
      : null
  }
}

// Mark all event emitting functions as noop,
// so they will be ignored when they will be not overridden
dummyFunctions.mark(
  ActionDispatcher.prototype._onActionCreated,
  ActionDispatcher.prototype._onActionUnknown,
  ActionDispatcher.prototype._onActionReady,
  ActionDispatcher.prototype._onActionExecution,
  ActionDispatcher.prototype._onActionSuccess,
  ActionDispatcher.prototype._onActionError,
  ActionDispatcher.prototype._processAction,
  ActionDispatcher.prototype._preExecuteAction,
  ActionDispatcher.prototype._processResult
)

module.exports = ActionDispatcher
