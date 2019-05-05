/**
 * Build regular expression based on action pattern.
 *
 * Action should have "abc.def" pattern, where each segment is separated by "." delimeter.
 *
 * There are two wildcard patterns:
 * - "*" - segment wildcard
 *   - "math.*" - will match i.e. "math.add" or "math.xyz"
 *   - "math.*.xyz" - will match i.e. "math.add.xyz" or "math.abc.xyz"
 *   - "math.ad*.xyz" - will match i.e. "math.add.xyz" or "math.addon.xyz"
 *   - "math.a*d.xyz" - will match i.e. "math.add.xyz" or "math.abrakad.xyz"
 * - "**" - any wildcard
 *   - "math.**" - will match i.e. "math.add", "math.xyz" or "math.xyz.abc"
 *   - "math.**.xyz" - will match i.e. "math.add.xyz", "math.abc.xyz" or "math.abc.def.xyz"
 *   - "math.ad**.xyz" - will match i.e. "math.add.xyz", "math.addon.xyz" or "math.addon.abcdef.xyz"
 *   - "math.a**d.xyz" - will match i.e. "math.add.xyz", "math.addod.xyz" or "math.addon.abd.xyz"
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
function resolveActionPatternExpression (pattern) {
  // Handle wildcard (any) pattern
  if (pattern === '**') {
    return /.+/
  }

  // Handle wildcard (segment) pattern
  if (pattern === '*') {
    return /^[^.]+$/
  }

  // Build regular expression pattern for not standard action
  const regexStr = pattern
    .replace(/[^a-zA-Z0-9]/g, $0 => `\\${$0}`)
    .replace(/\\\*\\\*/g, '.+')
    .replace(/\\\*/g, '[^.]+')

  // Build regular expression instance
  return new RegExp(`^${regexStr}$`)
}

module.exports = resolveActionPatternExpression
