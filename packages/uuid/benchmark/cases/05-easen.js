const uuid = require('../../index')
uuid.BUFFER_SIZE = 16384

module.exports = uuid.generate
