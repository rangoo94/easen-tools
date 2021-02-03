const uuid = require('uuid').v4

module.exports = () => uuid(undefined, Buffer.alloc(128))
