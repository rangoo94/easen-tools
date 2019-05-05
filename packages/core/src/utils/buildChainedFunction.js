const ActionExecutorFunctionBuilder = require('../internal/ActionExecutorFunctionBuilder')

/**
 * Build chained function,
 * which may be synchronous or promise-based.
 * Remember: as ActionDispatcher handle it anyway,
 * this function may either return a promise or static value.
 *
 * @param {function[]} fns
 * @param {number} [bindArguments]
 * @returns {function}
 */
function buildChainedFunction (fns, bindArguments = 0) {
  // Initialize data
  const count = fns.length

  // Create function builder
  const fnMain = new ActionExecutorFunctionBuilder()
    .setName('chain$$fn')

  // Create list of bind argument names
  const bindArgumentNames = Array.from(new Array(bindArguments)).map(() => fnMain.getTemporaryVariable())
  const argumentNames = bindArgumentNames.concat('$value')

  // Set up available arguments
  fnMain.setArguments.apply(fnMain, argumentNames)

  // Write return clause for value passed to function
  fnMain.finish('$value')

  // Iterate over all functions to create corresponding steps
  for (let i = fns.length - 1; i >= 0; i--) {
    const currentHandler = fns[i]
    const isLast = fns.length - 1 === i

    // Initialize variables naming
    const fnName = `chain$$${i + 1}of${count}`
    const handlerFnName = `$h${i + 1}`
    const nextStepFnName = `$c${i + 1}`
    const currentStepFnName = `$c${i}`

    // Build code parts
    const bindingCode = bindArgumentNames.length === 0 ? '' : `.bind(null, ${bindArgumentNames.join(',')})`
    const callbackCode = `${nextStepFnName}${bindingCode}`
    const promiseHandlingCode = isLast
      ? ''
      : `if ($value && typeof $value.then == 'function') { return $value.then(${callbackCode}) }`

    // Include handler in function context
    fnMain.setContext(handlerFnName, currentHandler)

    // Finish stuff
    fnMain.prepend(`var $value = ${handlerFnName}(${argumentNames}); ${promiseHandlingCode}`)

    // Build handler and attach it to main
    fnMain.setContext(
      currentStepFnName,
      fnMain.clone().setName(fnName).build()
    )
  }

  // Return main function
  return fnMain.build()
}

module.exports = buildChainedFunction
