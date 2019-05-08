const ServiceError = require('./ServiceError')

/**
 * Create ServiceError classes factory.
 * It will build ServiceError child constructor,
 * which may be used through whole application.
 *
 * @param {string} name
 * @param {number} [code]
 * @returns {function}
 */
function createServiceErrorSubClass (name, code = 500) {
  // Normalize error code
  code = parseInt(code, 10)

  // Either handle native JS classes or simple prototype-based fallback
  const constructorBody = Object.setPrototypeOf ? `
    var obj = new ServiceError(body);
    Object.setPrototypeOf(obj, ${name}.prototype);
    
    obj.name = ${JSON.stringify(name)};
    ${isNaN(code) ? '' : `obj.code = ${code};`}
    
    return obj;
  ` : `
    ServiceError.call(this, body);

    this.name = ${JSON.stringify(name)};
    ${isNaN(code) ? '' : `this.code = ${code};`}
  `

  // Create constructor
  // eslint-disable-next-line
  const ErrorConstructor = new Function('ServiceError', `return function ${name}(body) {
    ${constructorBody}
  }`)(ServiceError)

  // Apply prototype chain
  ErrorConstructor.prototype = Object.create(ServiceError.prototype)
  ErrorConstructor.prototype.constructor = ErrorConstructor

  return ErrorConstructor
}

module.exports = createServiceErrorSubClass
