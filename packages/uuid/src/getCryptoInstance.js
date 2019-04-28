/**
 * Get instance of Crypto API.
 *
 * @returns {Crypto|null}
 */
function getCryptoInstance () {
  // Check for Crypto available in global context
  if (typeof crypto !== 'undefined') {
    return crypto
  }

  // Check for Microsoft-prefixed Crypto
  if (typeof window !== 'undefined' && typeof window.msCrypto !== 'undefined') {
    return window.msCrypto
  }

  // Check for Crypto module
  if (typeof module !== 'undefined' && typeof require === 'function') {
    try {
      return require('crypto')
    } catch (error) {
      // Ignore missing 'crypto' package
    }
  }

  // Can't find :(
  return null
}

module.exports = getCryptoInstance
