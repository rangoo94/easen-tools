const expect = require('chai').expect

const dummyFunctions = require('../../src/utils/dummyFunctions')

describe('core', () => {
  describe('utils.dummyFunctions', () => {
    it('should throw error for incorrect arguments passed', () => {
      const fn = () => {}

      expect(() => dummyFunctions.mark('bla')).to.throw()
      expect(() => dummyFunctions.mark(null)).to.throw()
      expect(() => dummyFunctions.mark({ a: 10 })).to.throw()
      expect(() => dummyFunctions.mark([ fn ])).to.throw()
      expect(() => dummyFunctions.mark(fn, null)).to.throw()
      expect(() => dummyFunctions.mark(fn, 'bla')).to.throw()
      expect(() => dummyFunctions.mark(fn, { a: 10 })).to.throw()
    })

    it('should return back a marked function', () => {
      const fn1 = () => {}
      const fn2 = () => {}
      const fn3 = () => {}

      expect(dummyFunctions.mark(fn1)).to.equal(fn1)
      expect(dummyFunctions.mark(fn2, fn3)).to.equal(fn2)
    })

    it('should allow passing for marking same function twice', () => {
      const fn = () => {}

      expect(dummyFunctions.mark(dummyFunctions.mark(fn))).to.equal(fn)
    })

    it('should detect unmarked function', () => {
      const fn = () => {}

      expect(dummyFunctions.is(fn)).to.equal(false)
    })

    it('should detect simple types as unmarked', () => {
      const fn = () => {}

      expect(dummyFunctions.is('bla')).to.equal(false)
      expect(dummyFunctions.is(null)).to.equal(false)
      expect(dummyFunctions.is({ a: 10 })).to.equal(false)
      expect(dummyFunctions.is([ fn ])).to.equal(false)
    })

    it('should detect marked functions', () => {
      const fn1 = () => {}
      const fn2 = () => {}
      const fn3 = () => {}

      dummyFunctions.mark(fn1)
      dummyFunctions.mark(fn2, fn3)

      expect(dummyFunctions.is(fn1)).to.equal(true)
      expect(dummyFunctions.is(fn2)).to.equal(true)
      expect(dummyFunctions.is(fn3)).to.equal(true)
    })
  })
})
