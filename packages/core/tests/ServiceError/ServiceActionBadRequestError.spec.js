const expect = require('chai').expect

const ServiceBadRequestError = require('../../src/ServiceError/ServiceBadRequestError')

describe('core', () => {
  describe('ServiceError.ServiceBadRequestError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceBadRequestError().$serviceError).to.be.equal(true)
    })

    it('should be Error instance', () => {
      expect(new ServiceBadRequestError()).to.be.instanceOf(Error)
    })

    it('should have proper name', () => {
      expect(new ServiceBadRequestError().name).to.equal('ServiceBadRequestError')
    })

    it('should have proper code', () => {
      expect(new ServiceBadRequestError().code).to.equal(400)
    })

    it('should allow passing message', () => {
      expect(new ServiceBadRequestError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should disallow incorrect message', () => {
      expect(new ServiceBadRequestError({ a: 10 }).message).to.equal('')
      expect(new ServiceBadRequestError([ 10, 20 ]).message).to.equal('')
      expect(new ServiceBadRequestError(true).message).to.equal('')
      expect(new ServiceBadRequestError(null).message).to.equal('')
      expect(new ServiceBadRequestError(undefined).message).to.equal('')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceBadRequestError(v).body).to.equal(v)
      expect(new ServiceBadRequestError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceBadRequestError({ a: 10 }).body).to.deep.equal({ a: 10 })
      expect(new ServiceBadRequestError([ 10, 20 ]).body).to.deep.equal([ 10, 20 ])
    })
  })
})
