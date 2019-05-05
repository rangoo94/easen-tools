const expect = require('chai').expect

const buildChainedFunction = require('../../src/utils/buildChainedFunction')

describe('core', () => {
  describe('utils.buildChainedFunction', () => {
    it('should return a function', () => {
      expect(typeof buildChainedFunction([])).to.equal('function')
      expect(typeof buildChainedFunction([ x => x ])).to.equal('function')
    })

    it('should pass value to single function', () => {
      const fn = buildChainedFunction([ a => a + 10 ])

      expect(fn(1)).to.equal(11)
    })

    it('should pass value to functions chain', () => {
      // means: ((a + 10) + 10)
      const fn = buildChainedFunction([
        a => a + 10,
        a => a + 10
      ])

      expect(fn(1)).to.equal(21)
    })

    it('should work with asynchronous functions chain', async () => {
      // means: ((a + 10) + 10)
      const fn = buildChainedFunction([
        a => Promise.resolve(a + 10),
        a => Promise.resolve(a + 10)
      ])

      const promise = fn(1)

      expect(promise && typeof promise.then === 'function').to.equal(true)

      expect(await promise).to.equal(21)
    })

    it('should work with mixed synchronous & asynchronous functions chain', async () => {
      // means: (((a + 10) + 10) + 10)
      const fn = buildChainedFunction([
        a => a + 10,
        a => Promise.resolve(a + 10),
        a => a + 10
      ])

      const promise = fn(1)

      expect(promise && typeof promise.then === 'function').to.equal(true)

      expect(await promise).to.equal(31)
    })

    describe('bind arguments', () => {
      it('should return a function', () => {
        expect(typeof buildChainedFunction([], 3)).to.equal('function')
        expect(typeof buildChainedFunction([ x => x ], 3)).to.equal('function')
      })

      it('should return back value when there are no functions chained', () => {
        const fn = buildChainedFunction([])

        expect(fn(1)).to.equal(1)
      })

      it('should pass value to single function', () => {
        const fn = buildChainedFunction([ (a, b) => a + b ], 1)

        expect(fn(1, 9)).to.equal(10)
      })

      it('should pass value to functions chain', () => {
        // means: (a + (a + b))
        const fn = buildChainedFunction([
          (a, b) => a + b,
          (a, b) => a + b
        ], 1)

        expect(fn(10, 1)).to.equal(21)
      })

      it('should work with asynchronous functions chain', async () => {
        // means: (a + (a + b))
        const fn = buildChainedFunction([
          (a, b) => Promise.resolve(a + b),
          (a, b) => Promise.resolve(a + b)
        ], 1)

        const promise = fn(10, 1)

        expect(promise && typeof promise.then === 'function').to.equal(true)

        expect(await promise).to.equal(21)
      })

      it('should work with mixed synchronous & asynchronous functions chain', async () => {
        // means: (a + (a + (a + b)))
        const fn = buildChainedFunction([
          (a, b) => a + b,
          (a, b) => Promise.resolve(a + b),
          (a, b) => a + b
        ], 1)

        const promise = fn(10, 1)

        expect(promise && typeof promise.then === 'function').to.equal(true)

        expect(await promise).to.equal(31)
      })
    })
  })
})
