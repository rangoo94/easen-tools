const expect = require('chai').expect

const mutateActionParams = require('../../src/utils/mutateActionParams')

describe('core', () => {
  describe('utils.mutateActionParams', () => {
    it('should throw error for incorrect argument', () => {
      expect(() => mutateActionParams('xxx')).to.throw()
    })

    it('should create a function', () => {
      const mutator = params => params
      const handler = mutateActionParams(mutator)

      expect(typeof handler).to.equal('function')
    })

    it('should mutate params through this method', () => {
      const mutator = params => ({ b: params.a + 10 })
      const context = { params: { a: 10 } }

      const handler = mutateActionParams(mutator)
      const result = handler(context)

      expect(result).to.deep.equal({ params: { b: 20 } })
      expect(context).to.equal(result)
    })
  })
})
