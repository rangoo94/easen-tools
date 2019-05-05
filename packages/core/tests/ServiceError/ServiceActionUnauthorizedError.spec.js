const expect = require('chai').expect

const ServiceActionUnauthorizedError = require('../../src/ServiceError/ServiceActionUnauthorizedError')

describe('core', () => {
  describe('ServiceError.ServiceActionUnauthorizedError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceActionUnauthorizedError().$serviceError).to.be.equal(true)
    })

    it('should be Error instance', () => {
      expect(new ServiceActionUnauthorizedError()).to.be.instanceOf(Error)
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
