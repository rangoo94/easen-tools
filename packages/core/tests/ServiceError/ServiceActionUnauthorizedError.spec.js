const expect = require('chai').expect

const ServiceActionUnauthorizedError = require('../../src/ServiceError/ServiceActionUnauthorizedError')
const ServiceError = require('../../src/ServiceError')

describe('core', () => {
  describe('ServiceError.ServiceActionUnauthorizedError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceActionUnauthorizedError().$serviceError).to.be.equal(true)
    })

    it('should have proper instance type', () => {
      expect(new ServiceActionUnauthorizedError()).to.be.instanceOf(Error)
      expect(new ServiceActionUnauthorizedError()).to.be.instanceOf(ServiceError)
      expect(new ServiceActionUnauthorizedError()).to.be.instanceOf(ServiceActionUnauthorizedError)
    })

    it('should have proper name', () => {
      expect(new ServiceActionUnauthorizedError().name).to.equal('ServiceActionUnauthorizedError')
    })

    it('should have proper code', () => {
      expect(new ServiceActionUnauthorizedError().code).to.equal(401)
    })

    it('should allow passing message', () => {
      expect(new ServiceActionUnauthorizedError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceActionUnauthorizedError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceActionUnauthorizedError(v).body).to.deep.equal(v)
      expect(new ServiceActionUnauthorizedError({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
