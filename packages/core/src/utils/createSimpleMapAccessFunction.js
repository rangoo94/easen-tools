/**
 * Create function, which will point (in fast way) calls to functions map.
 * It's prepared for actionContext with 'name' property included.
 *
 * @param {object} map
 * @param {number} [argumentsCount]
 * @param {number} [omittedArgumentsCount]
 * @returns {function(*): *}
 */
function createSimpleMapAccessFunction (map, argumentsCount = 1, omittedArgumentsCount = 0) {
  // Retrieve data from map
  const keys = Object.keys(map).filter(x => typeof map[x] === 'function')
  const argNames = keys.map((x, index) => `$h${index}`)
  const argValues = keys.map(x => map[x])

  // Create list of arguments
  const argsList = Array.from(new Array(argumentsCount)).map((x, index) => `$${index}`)
  const inputCode = argsList.join(',')
  const passedArgs = argsList.slice(omittedArgumentsCount)
  const passedCode = passedArgs.join(',')

  // Build if/else code for all values
  let code = keys.map((name, index) => `
    ${index === 0 ? '' : 'else '}if ($0 === ${JSON.stringify(name)}) {
      return $h${index}(${passedCode});
    }
  `).join('')

  // Build function
  const FnConstructor = Function.bind(Function, argNames)
  const factory = new FnConstructor(`
    return function $simpleHandler (${inputCode}) {
      ${code}
      
      return ${passedArgs[0]};
    }
  `)

  return factory.apply(null, argValues)
}

module.exports = createSimpleMapAccessFunction
