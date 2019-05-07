/**
 * If you would like to modified default implementations
 * used by this package, you may modify these defaults.
 *
 * Remember:
 * You should import and modify these BEFORE loading anything other.
 */

// Use native promises by default
exports.Promise = Promise

// As UUID implementation,
// use safe UUID v4 implementation from '@easen-tools/uuid' package
exports.buildUuid = require('@easen-tools/uuid').generate

// As getter for micro-time use `microtime-x` package,
// which will work both for Node.js and browser
exports.getMicroTime = require('microtime-x')
