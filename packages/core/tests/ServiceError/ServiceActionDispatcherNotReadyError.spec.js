const expect = require('chai').expect

const ServiceActionDispatcherNotReadyError = require('../../src/ServiceError/ServiceActionDispatcherNotReadyError')
const ServiceError = require('../../src/ServiceError')

describe('core', () => {
  describe('ServiceError.ServiceActionDispatcherNotReadyError', () => {
    it('should be marked as service error', () => {
      expect(new ServiceActionDispatcherNotReadyError().$serviceError).to.be.equal(true)
    })

    it('should have proper instance type', () => {
      expect(new ServiceActionDispatcherNotReadyError()).to.be.instanceOf(Error)
      expect(new ServiceActionDispatcherNotReadyError()).to.be.instanceOf(ServiceError)
      expect(new ServiceActionDispatcherNotReadyError()).to.be.instanceOf(ServiceActionDispatcherNotReadyError)
    })

    it('should have proper name', () => {
      expect(new ServiceActionDispatcherNotReadyError().name).to.equal('ServiceActionDispatcherNotReadyError')
    })

    it('should have proper code', () => {
      expect(new ServiceActionDispatcherNotReadyError().code).to.equal(502)
    })

    it('should allow passing message', () => {
      expect(new ServiceActionDispatcherNotReadyError('some-message-is-here').message).to.equal('some-message-is-here')
    })

    it('should allow passing body', () => {
      const v = { a: 10, b: 20 }

      expect(new ServiceActionDispatcherNotReadyError('some-message-is-here').body).to.equal('some-message-is-here')
      expect(new ServiceActionDispatcherNotReadyError(v).body).to.deep.equal(v)
      expect(new ServiceActionDispatcherNotReadyError({ a: 10 }).body).to.deep.equal({ a: 10 })
    })
  })
})
