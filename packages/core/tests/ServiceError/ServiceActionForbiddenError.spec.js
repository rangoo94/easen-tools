const expect = require('chai').expect

const ServiceActionForbiddenError = require('../../src/ServiceError/ServiceActionForbiddenError')
const ServiceError = require('../../src/ServiceError')

describe('core', () => {
  describe('ServiceError.ServiceActionForbiddenError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceActionForbiddenError().$serviceError).to.be.equal(true)
    })

    it('should have proper instance type', () => {
      expect(new ServiceActionForbiddenError()).to.be.instanceOf(Error)
      expect(new ServiceActionForbiddenError()).to.be.instanceOf(ServiceError)
      expect(new ServiceActionForbiddenError()).to.be.instanceOf(ServiceActionForbiddenError)
    })

    it('should have proper name', () => {
      expect(new ServiceActionForbiddenError().name).to.equal('ServiceActionForbiddenError')
    })

    it('should have proper code', () => {
      expect(new ServiceActionForbiddenError().code).to.equal(403)
    })

    it('should allow passing message', () => {
      expect(new ServiceActionForbiddenError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceActionForbiddenError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceActionForbiddenError(v).body).to.deep.equal(v)
      expect(new ServiceActionForbiddenError({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
