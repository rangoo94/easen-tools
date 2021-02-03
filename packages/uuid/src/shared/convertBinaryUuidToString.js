// Get HEX bytes representation
const hexBytes = require('../shared/hexBytes')

module.exports = function convertBinaryUuidToString (uuid) {
  return hexBytes[uuid[0]] + hexBytes[uuid[1]] +
    hexBytes[uuid[2]] + hexBytes[uuid[3]] + '-' +
    hexBytes[uuid[4]] + hexBytes[uuid[5]] + '-' +
    hexBytes[uuid[6]] + hexBytes[uuid[7]] + '-' +
    hexBytes[uuid[8]] + hexBytes[uuid[9]] + '-' +
    hexBytes[uuid[10]] + hexBytes[uuid[11]] +
    hexBytes[uuid[12]] + hexBytes[uuid[13]] +
    hexBytes[uuid[14]] + hexBytes[uuid[15]]
}
