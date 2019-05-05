const expect = require('chai').expect

const ImmediateResult = require('../src/ImmediateResult')

describe('core', () => {
  describe('ImmediateResult', () => {
    it('should be able to be constructed', () => {
      expect(() => new ImmediateResult('value')).to.not.throw()
    })

    it('should throw error without constructor', () => {
      expect(() => ImmediateResult('value')).to.throw()
    })

    it('should be able to test it by special meta property', () => {
      const result = new ImmediateResult('value')

      expect(result.$immediateResult).to.equal(true)
      expect('$immediateResult' in result).to.equal(true)
    })

    it('should pass body down', () => {
      const result1 = new ImmediateResult('value')
      const result2 = new ImmediateResult(true)
      const result3 = new ImmediateResult({ something: { is: 'there' } })

      expect(result1.value).to.equal('value')
      expect(result2.value).to.equal(true)
      expect(result3.value).to.deep.equal({ something: { is: 'there' } })
    })
  })
})
