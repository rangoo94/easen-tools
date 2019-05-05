const expect = require('chai').expect

const resolveActionPatternExpression = require('../../src/utils/resolveActionPatternExpression')

describe('core', () => {
  describe('utils.resolveActionPatternExpression', () => {
    it('should never match empty string', () => {
      expect('').to.not.match(resolveActionPatternExpression('**'))
      expect('').to.not.match(resolveActionPatternExpression('*'))
      expect('').to.not.match(resolveActionPatternExpression('abc*'))
      expect('').to.not.match(resolveActionPatternExpression('abc.*'))
      expect('').to.not.match(resolveActionPatternExpression('abc**'))
      expect('').to.not.match(resolveActionPatternExpression('abc.**'))
      expect('').to.not.match(resolveActionPatternExpression('abc.def.*'))
    })

    it('should create pattern which match any action', () => {
      const regex = resolveActionPatternExpression('**')

      expect('abc').to.match(regex)
      expect('abc.def').to.match(regex)
      expect('abc.def.xyz').to.match(regex)
    })

    it('should create pattern which match single segment', () => {
      const regex = resolveActionPatternExpression('*')

      expect('abc').to.match(regex)
      expect('abc.def').to.not.match(regex)
      expect('abc.def.xyz').to.not.match(regex)
    })

    it('should create pattern with single segment wildcard', () => {
      const regex = resolveActionPatternExpression('abc.*')

      expect('abc').to.not.match(regex)
      expect('abc.def').to.match(regex)
      expect('abc.defxyz').to.match(regex)
      expect('abc.def.xyz').to.not.match(regex)
    })

    it('should create pattern with multiple single segment wildcard', () => {
      const regex = resolveActionPatternExpression('abc.*.*')

      expect('abc.def.xyz').to.match(regex)

      expect('abc').to.not.match(regex)
      expect('abc.def').to.not.match(regex)
      expect('abc.defxyz').to.not.match(regex)
      expect('abc.def.xyz.abc').to.not.match(regex)
    })

    it('should create pattern with single segment wildcard between', () => {
      const regex = resolveActionPatternExpression('abc.*.xyz')

      expect('abc.def.xyz').to.match(regex)

      expect('abc').to.not.match(regex)
      expect('abc.def').to.not.match(regex)
      expect('abc.defxyz').to.not.match(regex)
      expect('abc.def.abc').to.not.match(regex)
      expect('abc.def.xyz.abc').to.not.match(regex)
    })

    it('should create pattern with single segment starting on sth', () => {
      const regex = resolveActionPatternExpression('abc.s*')

      expect('abc.sdef').to.match(regex)

      expect('abc').to.not.match(regex)
      expect('abc.def').to.not.match(regex)
      expect('abc.defxyz').to.not.match(regex)
      expect('abc.def.xyz').to.not.match(regex)
      expect('abc.sdef.xyz').to.not.match(regex)
      expect('abc.s').to.not.match(regex)
    })

    it('should create simple pattern with single segment starting on sth', () => {
      const regex = resolveActionPatternExpression('s*')

      expect('sabc').to.match(regex)

      expect('s').to.not.match(regex)
      expect('sabc.sss').to.not.match(regex)
    })

    it('should create simple pattern with single segment ending on sth', () => {
      const regex = resolveActionPatternExpression('*s')

      expect('abcs').to.match(regex)

      expect('s').to.not.match(regex)
      expect('abcs.sss').to.not.match(regex)
    })

    it('should create simple pattern with any-wildcard', () => {
      const regex = resolveActionPatternExpression('abc.**')

      expect('abc.def').to.match(regex)
      expect('abc.def.xyz').to.match(regex)

      expect('abc').to.not.match(regex)
    })

    it('should create simple pattern with any-wildcard starting on sth', () => {
      const regex = resolveActionPatternExpression('s**')

      expect('sabc').to.match(regex)
      expect('sabc.def').to.match(regex)
      expect('sabc.def.xyz').to.match(regex)

      expect('abc').to.not.match(regex)
      expect('abc.def').to.not.match(regex)
      expect('abc.def.xyz').to.not.match(regex)
    })

    it('should create simple pattern with any-wildcard ending on sth', () => {
      const regex = resolveActionPatternExpression('**.sth')

      expect('abc.sth').to.match(regex)
      expect('abc.xyz.sth').to.match(regex)
      expect('a.sth').to.match(regex)

      expect('abc').to.not.match(regex)
      expect('abc.sth.xyz').to.not.match(regex)
      expect('abcsth').to.not.match(regex)
    })

    it('should work with special characters', () => {
      const regex = resolveActionPatternExpression('$@!node.*')

      expect('$@!node.sth').to.match(regex)
      expect('$@!node.xyz').to.match(regex)

      expect('$@!node').to.not.match(regex)
      expect('$@!node.sth.xyz').to.not.match(regex)
      expect('$@!nodesth').to.not.match(regex)
    })
  })
})
