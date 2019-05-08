const expect = require('chai').expect

const ServiceActionNotFoundError = require('../../src/ServiceError/ServiceActionNotFoundError')
const ServiceError = require('../../src/ServiceError')

describe('core', () => {
  describe('ServiceError.ServiceActionNotFoundError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceActionNotFoundError().$serviceError).to.be.equal(true)
    })

    it('should have proper instance type', () => {
      expect(new ServiceActionNotFoundError()).to.be.instanceOf(Error)
      expect(new ServiceActionNotFoundError()).to.be.instanceOf(ServiceError)
      expect(new ServiceActionNotFoundError()).to.be.instanceOf(ServiceActionNotFoundError)
    })

    it('should have proper name', () => {
      expect(new ServiceActionNotFoundError().name).to.equal('ServiceActionNotFoundError')
    })

    it('should have proper code', () => {
      expect(new ServiceActionNotFoundError().code).to.equal(400)
    })

    it('should allow passing message', () => {
      expect(new ServiceActionNotFoundError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceActionNotFoundError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceActionNotFoundError(v).body).to.deep.equal(v)
      expect(new ServiceActionNotFoundError({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
