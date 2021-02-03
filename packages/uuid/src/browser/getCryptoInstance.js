/**
 * Get instance of Crypto API.
 *
 * @returns {Crypto|null}
 */
function getCryptoInstance () {
  // Check for Crypto available in global context
  if (typeof crypto !== 'undefined') {
    // eslint-disable-next-line
    return crypto
  }

  // Check for Microsoft-prefixed Crypto
  if (typeof window !== 'undefined' && typeof window.msCrypto !== 'undefined') {
    return window.msCrypto
  }

  // Can't find :(
  return null
}

module.exports = getCryptoInstance
