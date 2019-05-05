class FunctionBuilder {
  constructor () {
    this._context = []
    this._args = []
    this._name = ''
    this._code = ''
    this._errorHandlerCode = ''
    this._index = 0
  }

  /**
   * Declare a variable.
   *
   * @param {string} name
   * @param {string} code
   * @returns {ActionExecutorBuilder|this}
   * @chainable
   */
  declare (name, code) {
    return this.append(`var ${name} = ${code};`)
  }

  /**
   * Attach 'if' construction.
   *
   * @param {string} condition
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  conditional (condition) {
    return this.append(`if (${condition})`)
  }

  /**
   * Do static assertion - when `variable` is available in context,
   * the code will be attached.
   *
   * @param {string|null} variable
   * @param {string} internalFnName
   * @param {string[]} [args]
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  callAvailable (variable, internalFnName, args) {
    const declare = variable ? `var ${variable} =` : ''

    return this.whenAvailable(
      internalFnName,
      `${declare}${internalFnName}(${args ? args.join(', ') : ''});`
    )
  }

  /**
   * Do static assertion - when `variable` is available in context,
   * the code will be attached.
   *
   * @param {string} variable
   * @param {string|function(FunctionBuilder|this)} fnOrCode
   * @param {string|function(FunctionBuilder|this)} [otherwiseFnOrCode]
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  whenAvailable (variable, fnOrCode, otherwiseFnOrCode) {
    return this.when(variable in this._context, fnOrCode, otherwiseFnOrCode)
  }

  /**
   * Do static assertion to attach code.
   *
   * @param {boolean} assertion
   * @param {string|function(FunctionBuilder|this)} fnOrCode
   * @param {string|function(FunctionBuilder|this)} [otherwiseFnOrCode]
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  when (assertion, fnOrCode, otherwiseFnOrCode) {
    if (assertion) {
      if (typeof fnOrCode === 'string') {
        this.append(fnOrCode)
      } else {
        fnOrCode(this)
      }
    } else if (otherwiseFnOrCode !== undefined) {
      if (typeof otherwiseFnOrCode === 'string') {
        this.append(otherwiseFnOrCode)
      } else {
        otherwiseFnOrCode(this)
      }
    }

    return this
  }

  /**
   * Open block.
   *
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  open () {
    return this.append('{')
  }

  /**
   * Close block.
   *
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  close () {
    return this.append(`}`)
  }

  /**
   * Append code at the end.
   *
   * @param {string} code
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  append (code) {
    this._code += code

    return this
  }

  /**
   * Add code at the beginning.
   *
   * @param {string} code
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  prepend (code) {
    this._code = code + this._code

    return this
  }

  /**
   * Return value.
   *
   * @param {string} code
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  finish (code) {
    return this.append(`return ${code};`)
  }

  /**
   * Set name for generated function.
   *
   * @param {string} name
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  setName (name) {
    this._name = name

    return this
  }

  /**
   * Set code for handling synchronous errors in code.
   * It will wrap whole code with try/catch construction,
   * and you may use `$error` variable in error handler code.
   *
   * @param {string} code
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  setErrorHandlerCode (code) {
    this._errorHandlerCode = code

    return this
  }

  /**
   * Set variable in context.
   *
   * @param {string} name
   * @param {*} value
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  setContext (name, value) {
    this._context[name] = value

    return this
  }

  /**
   * Add arguments which will be required in this function.
   *
   * @param {string} name1
   * @param {string} [...names]
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  addArguments (/* ...names */) {
    this._args.push.apply(this._args, arguments)

    return this
  }

  /**
   * Set arguments which will be required in this function.
   *
   * @param {string} name1
   * @param {string} [...names]
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  setArguments (/* ...names */) {
    this._args = [].slice.call(arguments)

    return this
  }

  /**
   * Get ID for next temporary variable,
   * which can be used within function.
   *
   * @returns {string}
   */
  getTemporaryVariable () {
    return `$${this._index++}`
  }

  /**
   * Build code which will return this function.
   *
   * @param {boolean} [clean]  should it remove unnecessary spaces? may be little buggy.
   * @returns {string}
   */
  buildCode (clean) {
    // Retrieve code
    const executionCode = this._code.replace(/^;*\s*/, '')
    const errorHandlerCode = (this._errorHandlerCode || '').replace(/^;*\s*/, '')

    // Attach try/catch construction if it's expected
    const _code = errorHandlerCode.length
      ? `try { ${executionCode} } catch ($error) { ${errorHandlerCode} }`
      : executionCode

    // Clean code from unnecessary spaces, if it's expected
    const code = clean
      ? _code.replace(/\s+/g, ' ')
      : _code

    // Build function definition
    const definition = `return function ${this._name} (${this._args.join(', ')})`

    // Build whole function returning code
    return `${definition} { ${code} }`
  }

  /**
   * Build a function instance based on definition.
   *
   * @param {boolean} [clean]  should it remove unnecessary spaces? may be little buggy.
   * @returns {function}
   */
  build (clean) {
    // Build function factory code
    const code = this.buildCode(clean)

    // Retrieve context data, remove variables which are definitely not used
    const contextNames = Object.keys(this._context).filter(name => code.indexOf(name) !== -1)
    const contextValues = contextNames.map(name => this._context[name])

    // Build a function factory constructor
    const FnFactoryConstructor = Function.bind.apply(Function, [ Function ].concat(contextNames))

    // Build a function factory
    const fnFactory = new FnFactoryConstructor(code)

    // Build a function
    return fnFactory.apply(fnFactory, contextValues)
  }

  /**
   * Create FunctionBuilder clone.
   *
   * @returns {FunctionBuilder|this}
   * @chainable
   */
  clone () {
    // Create new instance of FunctionBuilder (or any extending class)
    const builder = new this.constructor()

    // Copy data inside
    builder._context = Object.assign({}, this._context)
    builder._name = this._name
    builder._args = this._args.slice()
    builder._code = this._code
    builder._index = this._index
    builder._errorHandlerCode = this._errorHandlerCode

    // Return it
    return builder
  }
}

module.exports = FunctionBuilder
