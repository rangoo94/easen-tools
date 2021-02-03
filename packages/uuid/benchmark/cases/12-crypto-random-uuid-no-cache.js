const crypto = require('crypto')
const cryptoOptions = { disableEntropyCache: true }

module.exports = () => crypto.randomUUID(cryptoOptions)
