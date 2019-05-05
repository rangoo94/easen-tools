const expect = require('chai').expect

const ServiceError = require('../src/ServiceError')

describe('core', () => {
  describe('ServiceError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceError().$serviceError).to.be.equal(true)
    })

    it('should be Error instance', () => {
      expect(new ServiceError()).to.be.instanceOf(Error)
    })

    it('should have proper name', () => {
      expect(new ServiceError().name).to.equal('ServiceError')
    })

    it('should have proper code', () => {
      expect(new ServiceError().code).to.equal(500)
    })

    it('should allow passing message', () => {
      expect(new ServiceError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceError(v).body).to.deep.equal(v)
      expect(new ServiceError({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
