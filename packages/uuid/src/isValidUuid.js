const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

/**
 * Check if passed string is valid UUID v4.
 *
 * @param {string} uuid
 * @returns {boolean}
 */
function isValidUuid (uuid) {
  return typeof uuid === 'string' && uuidRegex.test(uuid)
}

module.exports = isValidUuid
