/**
 * It may be thrown while processing action,
 * to get out of the flow and immediately return a value.
 *
 * @class
 */
class ImmediateResult {
  /**
   * @param {*} value
   */
  constructor (value) {
    this.$immediateResult = true
    this.value = value
  }
}

module.exports = ImmediateResult
