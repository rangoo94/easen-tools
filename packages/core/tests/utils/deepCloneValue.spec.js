const expect = require('chai').expect

const deepCloneValue = require('../../src/utils/deepCloneValue')

describe('core', () => {
  describe('utils.deepCloneValue', () => {
    it('should clone simple values correctly', () => {
      expect(deepCloneValue(true)).to.equal(true)
      expect(deepCloneValue(null)).to.equal(null)
      expect(deepCloneValue(10)).to.equal(10)
      expect(deepCloneValue('str')).to.equal('str')
    })

    it('should ignore prototype keys', () => {
      const obj = Object.create({ a: 10 })
      obj.b = 10

      expect(deepCloneValue(obj)).to.deep.equal({ b: 10 })
      expect(deepCloneValue(obj)).to.not.equal({ b: 10 })
    })

    it('should clone simple object correctly', () => {
      const value = {
        a: 10,
        b: 'xxx'
      }

      const clonedValue = deepCloneValue(value)

      expect(clonedValue).to.deep.equal(value)
      expect(clonedValue).to.not.equal(value)
      expect(clonedValue.a).to.equal(value.a)
      expect(clonedValue.b).to.equal(value.b)
    })

    it('should clone deep object correctly', () => {
      const value = {
        a: 10,
        b: { c: 'xxx' },
        c: { d: { a: 10 }, b: '10', c: null }
      }

      const clonedValue = deepCloneValue(value)

      expect(clonedValue).to.deep.equal(value)
      expect(clonedValue).to.not.equal(value)
      expect(clonedValue.b).to.not.equal(value.b)
      expect(clonedValue.c).to.not.equal(value.c)
    })

    it('should clone array of objects correctly', () => {
      const value = [
        {
          a: 10,
          b: { c: 'xxx' },
          c: { d: { a: 10 }, b: '10', c: null }
        },
        {
          a: 10,
          b: { c: 'xxx' },
          c: { d: { a: 10 }, b: '10', c: null }
        }
      ]

      const clonedValue = deepCloneValue(value)

      expect(clonedValue).to.deep.equal(value)
      expect(clonedValue).to.not.equal(value)
      expect(clonedValue.length).to.equal(value.length)
      expect(clonedValue[0]).to.not.equal(value[0])
      expect(clonedValue[1]).to.not.equal(value[1])
      expect(clonedValue[0].b).to.not.equal(value[0].b)
      expect(clonedValue[0].c).to.not.equal(value[0].c)
    })
  })
})
