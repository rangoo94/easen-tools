const expect = require('chai').expect

const createSimpleMapAccessFunction = require('../../src/utils/createSimpleMapAccessFunction')

describe('core', () => {
  describe('utils.createSimpleMapAccessFunction', () => {
    it('should create a function', () => {
      expect(typeof createSimpleMapAccessFunction({})).to.equal('function')
      expect(typeof createSimpleMapAccessFunction({ a: x => x + 1 })).to.equal('function')
    })

    it('should return identity function when empty object provided', () => {
      const fn1 = createSimpleMapAccessFunction({})
      const fn2 = createSimpleMapAccessFunction({ a: null })
      const fn3 = createSimpleMapAccessFunction({ a: 'xyz' })

      expect(fn1('a', 2)).to.equal('a')
      expect(fn2('a', 2)).to.equal('a')
      expect(fn3('a', 2)).to.equal('a')
    })

    it('should call identity function when unknown key used', () => {
      const fn = createSimpleMapAccessFunction({
        a: x => x + 1
      })

      expect(fn('b', 2)).to.equal('b')
    })

    it('should call proper function when key used', () => {
      const fn = createSimpleMapAccessFunction({
        a: (a, b) => a + 1
      })
      const fn1 = createSimpleMapAccessFunction({
        a: (a, b) => a + 1,
        b: (a, b) => a + 2
      })

      expect(fn('a', 1)).to.equal('a1')
      expect(fn('b', 1)).to.equal('b')
      expect(fn1('b', 1)).to.equal('b2')
    })

    it('should omit some arguments', () => {
      const fn = createSimpleMapAccessFunction({
        a: x => x + 1
      }, 2, 1)

      const fn1 = createSimpleMapAccessFunction({
        a: x => x + 1,
        b: x => x + 2
      }, 2, 1)

      expect(fn('a', 1)).to.equal(2)
      expect(fn('b', 1)).to.equal(1)
      expect(fn1('b', 1)).to.equal(3)
    })

    it('should limit accepted number of arguments', () => {
      const map = {
        a: x => x + 1,
        b: x => x + 2
      }

      const fn1 = createSimpleMapAccessFunction(map, 1)
      const fn2 = createSimpleMapAccessFunction({}, 2)
      const fn3 = createSimpleMapAccessFunction(map, 5)
      const fn4 = createSimpleMapAccessFunction(map, 1, 1)

      expect(fn1.length).to.equal(1)
      expect(fn2.length).to.equal(2)
      expect(fn3.length).to.equal(5)
      expect(fn4.length).to.equal(1)
    })

    it('should limit passed number of arguments', () => {
      const fn = createSimpleMapAccessFunction({
        a: x => x + 1
      }, 1, 1)

      const fn1 = createSimpleMapAccessFunction({
        a: x => x + 1,
        b: x => x + 2
      }, 1, 1)
      const fn2 = createSimpleMapAccessFunction({}, 2)
      const fn3 = createSimpleMapAccessFunction({}, 5)

      expect(fn('a', 1)).to.deep.equal(NaN)
      expect(fn('b', 1)).to.equal(undefined)
      expect(fn1('b', 1)).to.deep.equal(NaN)

      expect(fn.length).to.equal(1)
      expect(fn2.length).to.equal(2)
      expect(fn3.length).to.equal(5)
    })

    it('should ignore mutations on accessed map', () => {
      const map = { a: x => x + 1 }

      const fn = createSimpleMapAccessFunction(map, 2, 1)

      map.b = x => x + 2

      expect(fn('a', 1)).to.equal(2)
      expect(fn('b', 1)).to.equal(1)
    })
  })
})
