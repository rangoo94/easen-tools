const ServiceActionNotFoundError = require('../ServiceError/ServiceActionNotFoundError')
const ActionExecutorFunctionBuilder = require('./ActionExecutorFunctionBuilder')

// Set up default options for action executor

const defaultOptions = {
  Promise: Promise,
  includeContext: true,
  ensurePromiseImplementation: true,
  onUncaughtError: null,
  onActionStateChange: null,
  createContext: null,
  isActionSupported: null,
  process: null,
  preExecute: null,
  execute: null,
  finalizeContext: null,
  processResult: null
}

// Set up internal function names

const InternalFnNames = {
  emit: '$emit',
  isActionSupported: '$supports',
  createContext: '$create',
  processAction: '$process',
  preExecuteAction: '$preExecute',
  executeAction: '$execute',
  processResult: '$processResult',
  finalizeContext: '$finalize'
}

/**
 * Validate options passed to action executor.
 *
 * @param {object} options
 * @param {function} options.createContext
 * @param {function} options.execute
 */
function validateActionExecutorOptions (options) {
  if (!options.createContext) {
    throw new Error('You need to pass action context creator')
  }

  if (!options.execute) {
    throw new Error('You need to pass action executor')
  }
}

/**
 * Create action executor.
 *
 * @param {object} [options]
 * @param {boolean} [options.includeContext]
 * @param {boolean} [options.ensurePromiseImplementation]
 * @param {function|{ reject: function }} [options.Promise]
 * @param {function} [options.onActionStateChange]
 * @param {function(string): boolean} [options.isActionSupported]
 * @param {function(string, object, object): object} [options.createContext]
 * @param {function(object)} [options.process]
 * @param {function(object)} [options.preExecute]
 * @param {function(object): *} [options.execute]
 * @param {function(object, object)} [options.finalizeContext]
 * @param {function(object, object)} [options.processResult]
 * @param {function} [options.onUncaughtError]
 * @returns {function(string, [object], [object]): Promise<*,*>|{ context: object }}
 */
function createActionExecutor (options) {
  // Set up options
  options = Object.assign({}, defaultOptions, options)

  // Validate passed data
  validateActionExecutorOptions(options)

  // Extract basic stuff
  const Promise = options.Promise
  const onActionStateChange = options.onActionStateChange

  // Extract procedure steps
  const includeContext = !!options.includeContext
  const ensurePromiseImplementation = !!options.ensurePromiseImplementation
  const isActionSupported = options.isActionSupported
  const createContext = options.createContext
  const processAction = options.process
  const preExecuteAction = options.preExecute
  const executeAction = options.execute
  const finalizeContext = options.finalizeContext
  const processResult = options.processResult
  const onUncaughtError = typeof options.onUncaughtError === 'function'
    ? options.onUncaughtError
    : console.warn.bind(console)

  // Initialize side effects

  const emitChange = onActionStateChange ? (state, context, value) => {
    try {
      onActionStateChange(state, context, value)
    } catch (error) {
      onUncaughtError(error)
    }
  } : null

  // Initialize internal functions map

  const internalFunctionsMap = {
    [InternalFnNames.emit]: emitChange,
    [InternalFnNames.isActionSupported]: isActionSupported,
    [InternalFnNames.createContext]: createContext,
    [InternalFnNames.processAction]: processAction,
    [InternalFnNames.preExecuteAction]: preExecuteAction,
    [InternalFnNames.executeAction]: executeAction,
    [InternalFnNames.finalizeContext]: finalizeContext,
    [InternalFnNames.processResult]: processResult
  }

  // Initialize abstract function with context set
  const fnAbstract = new ActionExecutorFunctionBuilder()
    .setContext('Promise', Promise)
    .setContext('ServiceActionNotFoundError', ServiceActionNotFoundError)

  // Set up values in context
  for (let fnName in internalFunctionsMap) {
    if (internalFunctionsMap[fnName]) {
      fnAbstract.setContext(fnName, internalFunctionsMap[fnName])
    }
  }

  // Create error handler

  const fnHandleError = fnAbstract.clone()
    .setArguments('$ctx', '$error')

    /* eslint-disable indent */
    // Handle ImmediateResult
    .conditional('$error && $error.$immediateResult')
    .open()
      // Pass ImmediateResult down
      .declare('$v', '$error.value')
      .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', '$v' ])
      .callAvailable('$v', InternalFnNames.processResult, [ '$v', '$ctx' ])

      // Emit "success" event
      .callAvailable(null, InternalFnNames.emit, [ '"success"', '$ctx', '$v' ])

      .finish('$v')
    .close()
    /* eslint-enable indent */

    // Handle real error
    .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', 'undefined', '$error' ])

    // Emit "error" event
    .callAvailable(null, InternalFnNames.emit, [ '"error"', '$ctx', '$error' ])

    .append('throw $error')

  // Create callback for asynchronous action execution

  const fnExecuteCallback = fnAbstract.clone()
    .setName('$dispatchAction$executeCallback')
    .setArguments('$ctx', '$v')

    // Execute callback
    .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', '$v' ])
    .callAvailable('$v', InternalFnNames.processResult, [ '$v', '$ctx' ])

    // Emit "success" event
    .callAvailable(null, InternalFnNames.emit, [ '"success"', '$ctx', '$v' ])

    .finish('$v')

  // Create callback for asynchronous action pre-execution

  const fnPreExecuteCallback = fnAbstract.clone()
    .setName('$dispatchAction$preExecuteCallback')
    .setArguments('$ctx')
    .setContext('$exCb', fnExecuteCallback.build())

    // Pre-execute callback
    // Emit "execution" event
    .callAvailable(null, InternalFnNames.emit, [ '"execution"', '$ctx' ])

    .whenAvailable(
      InternalFnNames.executeAction,
      x => x
        .append(`var $v = ${InternalFnNames.executeAction}($ctx);`)
        .handleAsyncContinuation('$v', '$exCb.bind(undefined, $ctx)')
    )

    // Execute callback
    .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', '$v' ])
    .callAvailable('$v', InternalFnNames.processResult, [ '$v', '$ctx' ])

    // Emit "success" event
    .callAvailable(null, InternalFnNames.emit, [ '"success"', '$ctx', '$v' ])

    .finish('$v')

  // Create callback for asynchronous action processing

  const fnProcessCallback = fnAbstract.clone()
    .setName('$dispatchAction$processCallback')
    .setArguments('$ctx')
    .setContext('$exCb', fnExecuteCallback.build())
    .setContext('$preCb', fnPreExecuteCallback.build())

    // Processing callback
    // Emit "ready" event
    .callAvailable(null, InternalFnNames.emit, [ '"ready"', '$ctx' ])

    .whenAvailable(
      InternalFnNames.preExecuteAction,
      x => x
        .append(`var $cc = ${InternalFnNames.preExecuteAction}($ctx);`)
        .handleAsyncContinuation('$cc', '$preCb.bind(undefined, $ctx)')
    )

    // Pre-execute callback
    // Emit "execution" event
    .callAvailable(null, InternalFnNames.emit, [ '"execution"', '$ctx' ])

    .whenAvailable(
      InternalFnNames.executeAction,
      x => x
        .append(`var $v = ${InternalFnNames.executeAction}($ctx);`)
        .handleAsyncContinuation('$v', '$exCb.bind(undefined, $ctx)')
    )

    // Execute callback
    .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', '$v' ])
    .callAvailable('$v', InternalFnNames.processResult, [ '$v', '$ctx' ])

    // Emit "success" event
    .callAvailable(null, InternalFnNames.emit, [ '"success"', '$ctx', '$v' ])

    .finish('$v')

  // Create callback for action context dispatching

  const fnDispatch = fnAbstract.clone()
    .setName('$dispatchAction')
    .setArguments('$ctx')
    .setContext('$exCb', fnExecuteCallback.build())
    .setContext('$preCb', fnPreExecuteCallback.build())
    .setContext('$proCb', fnProcessCallback.build())
    .setContext('$errCb', fnHandleError.build())
    .setErrorHandlerCode('return $errCb($ctx, $error);')

    .setErrorHandlerCode(includeContext ? `try {
      var $$promise = Promise.resolve($errCb($ctx, $error));
      $$promise.context = $ctx;
      return $$promise;
    } catch ($error) {
      var $$promise = Promise.reject($error);
      $$promise.context = $ctx;
      return $$promise;
    }` : `try {
      return Promise.resolve($errCb($ctx, $error));
    } catch ($error) {
      return Promise.reject($error);
    }`)

    // Processing
    .whenAvailable(
      InternalFnNames.processAction,
      x => x
        .append(`var $cc = ${InternalFnNames.processAction}($ctx);`)
        .handleAsyncContinuation(
          '$cc',
          '$proCb.bind(undefined, $ctx)',
          '$errCb.bind(undefined, $ctx)',
          ensurePromiseImplementation
        )
    )

    // Processing callback
    // Emit "ready" event
    .callAvailable(null, InternalFnNames.emit, [ '"ready"', '$ctx' ])

    .whenAvailable(
      InternalFnNames.preExecuteAction,
      x => x
        .append(`var $dd = ${InternalFnNames.preExecuteAction}($ctx);`)
        .handleAsyncContinuation(
          '$dd',
          '$preCb.bind(undefined, $ctx)',
          '$errCb.bind(undefined, $ctx)',
          ensurePromiseImplementation
        )
    )

    // Pre-execute callback
    // Emit "execution" event
    .callAvailable(null, InternalFnNames.emit, [ '"execution"', '$ctx' ])

    .whenAvailable(
      InternalFnNames.executeAction,
      x => x
        .append(`var $v = ${InternalFnNames.executeAction}($ctx);`)
        .handleAsyncContinuation(
          '$v',
          '$exCb.bind(undefined, $ctx)',
          '$errCb.bind(undefined, $ctx)',
          ensurePromiseImplementation
        )
    )

    // Execute callback
    .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', '$v' ])
    .callAvailable('$v', InternalFnNames.processResult, [ '$v', '$ctx' ])

    // Emit "success" event
    .callAvailable(null, InternalFnNames.emit, [ '"success"', '$ctx', '$v' ])

    .finish('Promise.resolve($v)')

  // Create "input" function

  const fnInit = fnAbstract.clone()
    .setName('$initAction')
    .setArguments('name', 'params', 'metaData')
    .setContext('$dispatch', fnDispatch.build())
    .setErrorHandlerCode(`return Promise.reject($error);`)

    .declare('$ctx', `${InternalFnNames.createContext}(name, params, metaData)`)

    // Emit "created" event
    .callAvailable(null, InternalFnNames.emit, [ '"created"', '$ctx' ])

    .whenAvailable(InternalFnNames.isActionSupported, x => x
      .conditional(`!${InternalFnNames.isActionSupported}(name)`)
      /* eslint-disable indent */
      .open()
        .declare('$errorUnknown', 'Promise.reject(new ServiceActionNotFoundError())')
        .callAvailable(null, InternalFnNames.finalizeContext, [ '$ctx', 'undefined', '$errorUnknown' ])

        // Emit "unknown" event
        .callAvailable(null, InternalFnNames.emit, [ '"unknown"', '$ctx' ])

        .when(
          includeContext,
          x => x.finishWithContext('$errorUnknown', '$ctx'),
          x => x.finish('$errorUnknown')
        )
      .close()
      /* eslint-enable indent */
    )
    .when(
      includeContext,
      x => x.finishWithContext('$dispatch($ctx)', '$ctx'),
      x => x.finish('$dispatch($ctx)')
    )

  // Return back "input" function
  return fnInit.build()
}

module.exports = createActionExecutor
