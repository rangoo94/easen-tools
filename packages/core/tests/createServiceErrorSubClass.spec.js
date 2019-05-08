const expect = require('chai').expect

const createServiceErrorSubClass = require('../src/createServiceErrorSubClass')
const ServiceError = require('../src/ServiceError')

describe('core', () => {
  describe('createServiceErrorSubClass', () => {
    const CustomClass = createServiceErrorSubClass('CustomClass')
    const CustomClassWithErrorCode = createServiceErrorSubClass('CustomClass', 666)

    it('should have proper function name', () => {
      expect(CustomClass.name).to.equal('CustomClass')
    })

    it('should be marked as service error', () => {
      expect(new CustomClass().$serviceError).to.be.equal(true)
    })

    it('should have proper instance type', () => {
      expect(new CustomClass()).to.be.instanceOf(Error)
      expect(new CustomClass()).to.be.instanceOf(ServiceError)
      expect(new CustomClass()).to.be.instanceOf(CustomClass)
    })

    it('should have proper name', () => {
      expect(new CustomClass().name).to.equal('CustomClass')
    })

    it('should have proper code', () => {
      expect(new CustomClass().code).to.equal(500)
      expect(new CustomClassWithErrorCode().code).to.equal(666)
    })

    it('should allow passing message', () => {
      expect(new CustomClass('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new CustomClass('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new CustomClass(v).body).to.deep.equal(v)
      expect(new CustomClass({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
