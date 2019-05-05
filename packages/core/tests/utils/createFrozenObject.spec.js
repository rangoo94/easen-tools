const expect = require('chai').expect

const createFrozenCopy = require('../../src/utils/createFrozenCopy')

describe('core', () => {
  describe('utils.createFrozenCopy', () => {
    it('should work with simple values', () => {
      expect(createFrozenCopy(true)).to.equal(true)
      expect(createFrozenCopy(null)).to.equal(null)
      expect(createFrozenCopy(10)).to.equal(10)
      expect(createFrozenCopy('str')).to.equal('str')
    })

    it('should create simple object with same structure', () => {
      const value = {
        a: 10,
        b: 'xxx'
      }

      const valueCopy = createFrozenCopy(value)

      expect(valueCopy).to.deep.equal(value)
      expect(valueCopy).to.not.equal(value)
      expect(valueCopy.b).to.equal(value.b)
    })

    it('should freeze simple object with same structure', () => {
      const value = {
        a: 10,
        b: 'xxx'
      }

      const valueCopy = createFrozenCopy(value)

      // Check if it's extensible
      expect(Object.isExtensible(valueCopy)).to.equal(false)

      // Validate if it disallow creating new property
      valueCopy.c = 10
      expect('c' in valueCopy).to.equal(false)

      // Validate if it disallow modifying property
      valueCopy.a = 100
      expect(valueCopy.a).to.equal(10)
    })

    it('should create complex object with same structure', () => {
      const value = {
        a: 10,
        b: { c: 'xxx' },
        c: { d: { a: 10 }, b: '10', c: null }
      }

      const valueCopy = createFrozenCopy(value)

      expect(valueCopy).to.deep.equal(value)
      expect(valueCopy).to.not.equal(value)
      expect(valueCopy.b).to.not.equal(value.b)
      expect(valueCopy.c).to.not.equal(value.c)
    })

    it('should deeply freeze objects', () => {
      const value = {
        a: 10,
        b: { c: 'xxx' },
        c: { d: { a: 10 }, b: '10', c: null },
        d: [ 10, 20 ]
      }

      const valueCopy = createFrozenCopy(value)

      // Check single level down
      expect(Object.isExtensible(valueCopy.b)).to.equal(false)
      valueCopy.b.d = 10
      expect('d' in valueCopy.b).to.equal(false)
      valueCopy.b.c = 100
      expect(valueCopy.b.c).to.equal('xxx')

      // Check single level down (array)
      expect(Object.isExtensible(valueCopy.b)).to.equal(false)
      valueCopy.d[1] = 10
      expect(valueCopy.d[1]).to.equal(20)
      valueCopy.d[2] = 10
      expect(valueCopy.d[2]).to.equal(undefined)
      expect(() => valueCopy.d.push(10)).to.throw()

      // Check two levels down
      expect(Object.isExtensible(valueCopy.c.d)).to.equal(false)
      valueCopy.c.d.d = 10
      expect('d' in valueCopy.c.d).to.equal(false)
      valueCopy.c.d.a = 100
      expect(valueCopy.c.d.a).to.equal(10)
    })

    it('should freeze array correctly', () => {
      const a = [ 10, 20, 30, { a: 10 } ]
      const b = createFrozenCopy(a)

      expect(Array.isArray(b)).to.equal(true)
      expect(b).to.deep.equal(a)
    })

    describe('unavailable Object.freeze', () => {
      const objectFreezeMethod = Object.freeze

      beforeEach(() => {
        delete Object.freeze
      })

      afterEach(() => {
        Object.freeze = objectFreezeMethod
      })

      it('should copy simple values anyway', () => {
        expect(createFrozenCopy(true)).to.equal(true)
        expect(createFrozenCopy(null)).to.equal(null)
        expect(createFrozenCopy(10)).to.equal(10)
        expect(createFrozenCopy('str')).to.equal('str')
      })

      it('should clone object anyway', () => {
        const value = {
          a: 10,
          b: { c: 'xxx' },
          c: { d: { a: 10 }, b: '10', c: null }
        }

        const valueCopy = createFrozenCopy(value)

        expect(valueCopy).to.deep.equal(value)
        expect(valueCopy).to.not.equal(value)
        expect(valueCopy.b).to.not.equal(value.b)
        expect(valueCopy.c).to.not.equal(value.c)
      })
    })
  })
})
