/**
 * Error, which represents any service connected error.
 *
 * @property {string} name
 * @property {string} message
 * @property {*} body
 * @property {number} code
 */
class ServiceError extends Error {
  /**
   * @param {*} [body]
   */
  constructor (body) {
    super(typeof body === 'string' ? body : undefined)
    this.$serviceError = true
    this.body = body
    this.name = 'ServiceError'
    this.code = 500
  }
}

module.exports = ServiceError
