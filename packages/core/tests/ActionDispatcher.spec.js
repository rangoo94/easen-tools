const expect = require('chai').expect
const sinon = require('sinon')

const Bluebird = require('bluebird')

const { ActionStatus, ActionEvent } = require('../src/constants')

const ActionDispatcher = require('../src/ActionDispatcher')
const ServiceActionDispatcherNotReadyError = require('../src/ServiceError/ServiceActionDispatcherNotReadyError')
const ServiceActionNotFoundError = require('../src/ServiceError/ServiceActionNotFoundError')

// Prepare ActionDispatcher classes

class EmptyActionDispatcher extends ActionDispatcher {}

class MinimumActionDispatcher extends ActionDispatcher {
  hasActionCaller (name) {
    return true
  }

  _executeAction (actionContext) {
    return `${actionContext.name} succeed.`
  }
}

class EchoActionDispatcher extends ActionDispatcher {
  hasActionCaller (name) {
    return true
  }

  _executeAction (actionContext) {
    return actionContext
  }
}

class MultiEchoActionDispatcher extends EchoActionDispatcher {
  hasActionCaller (name) {
    return name === 'echo' || name === 'error-test'
  }

  _executeAction (actionContext) {
    if (actionContext.name === 'error-test') {
      throw new Error('Meeeh')
    }

    return super._executeAction(actionContext)
  }
}

/**
 * Check if value is a promise (of any implementation).
 *
 * @param {*} value
 * @returns {boolean}
 */
function isPromise (value) {
  return typeof value === 'object' && !!value && typeof value.then === 'function'
}

function tick () {
  return new Promise(setTimeout)
}

describe('core', () => {
  describe('ActionDispatcher', () => {
    describe('abstraction', () => {
      it('should throw error without constructor', () => {
        expect(() => ActionDispatcher()).to.throw()
      })

      it('should throw error while instantiating abstract class', () => {
        expect(() => new ActionDispatcher()).to.throw()
      })

      it('should allow instantiating class which extends ActionDispatcher', () => {
        expect(() => new EmptyActionDispatcher()).to.not.throw()
      })

      it('should return promise on call', async () => {
        const dispatcher = new EmptyActionDispatcher()

        const promise = dispatcher.call('someAction')

        expect(isPromise(promise)).to.equal(true)

        await promise.catch(() => {})
      })

      it('should throw error when trying to execute action (no steps defined)', async () => {
        const dispatcher = new EmptyActionDispatcher()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('someAction')
          .then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(Error)
      })

      it('should throw error when trying to execute action (hasActionCaller defined only)', async () => {
        class ActionDispatcherWithHasActionCaller extends ActionDispatcher {
          hasActionCaller (name) {
            return true
          }
        }

        const dispatcher = new ActionDispatcherWithHasActionCaller()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('someAction')
          .then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(Error)
      })

      it('should throw error when trying to execute action (_executeAction defined only)', async () => {
        class ActionDispatcherWithExecuteAction extends ActionDispatcher {
          _executeAction (actionContext) {
            return `${actionContext.name} succeed.`
          }
        }

        const dispatcher = new ActionDispatcherWithExecuteAction()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('someAction')
          .then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(Error)
      })

      it('should execute action when both abstract methods (hasActionCaller and _executeAction) are defined', async () => {
        const dispatcher = new MinimumActionDispatcher()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('someAction')
          .then(onSuccess, onError)

        expect(onSuccess.called).to.equal(true)
        expect(onSuccess.calledWith('someAction succeed.')).to.equal(true)
      })

      it('should have `getActionsList` method, but throwing error', () => {
        const dispatcher = new EmptyActionDispatcher()

        expect(typeof dispatcher.getActionsList).to.equal('function')
        expect(() => dispatcher.getActionsList()).to.throw()
      })
    })

    describe('options', () => {
      it('should initialize without options passed', () => {
        expect(() => new EmptyActionDispatcher()).to.not.throw()
      })

      it('should initialize with empty options passed', () => {
        expect(() => new EmptyActionDispatcher()).to.not.throw()
      })

      describe('Promise implementation', () => {
        it('should validate Promise implementation', () => {
          expect(() => new EmptyActionDispatcher({ Promise: () => {} })).to.throw()
          expect(() => new EmptyActionDispatcher({ Promise: { resolve: () => {} } })).to.throw()
          expect(() => new EmptyActionDispatcher({ Promise: null })).to.throw()

          expect(() => new EmptyActionDispatcher({ Promise: Promise })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ Promise: Bluebird })).to.not.throw()
        })

        it('should use proper Promise implementation', () => {
          const dispatcher1 = new EmptyActionDispatcher({ Promise: Promise })
          const promise1 = dispatcher1.call('someAction')
          promise1.catch(x => x)
          expect(promise1).to.be.instanceOf(Promise)

          const dispatcher2 = new MinimumActionDispatcher({ Promise: Promise })
          const promise2 = dispatcher2.call('someAction')
          promise2.catch(x => x)
          expect(promise2).to.be.instanceOf(Promise)

          const dispatcher3 = new EmptyActionDispatcher({ Promise: Bluebird })
          const promise3 = dispatcher3.call('someAction')
          promise3.catch(x => x)
          expect(promise3).to.be.instanceOf(Bluebird)

          const dispatcher4 = new MinimumActionDispatcher({ Promise: Bluebird })
          const promise4 = dispatcher4.call('someAction')
          promise4.catch(x => x)
          expect(promise4).to.be.instanceOf(Bluebird)
        })
      })

      describe('UUID implementation', () => {
        it('should validate UUID implementation', async () => {
          expect(() => new EmptyActionDispatcher({ buildUuid: 'not-a-function' })).to.throw()
          expect(() => new EmptyActionDispatcher({ buildUuid: 999 })).to.throw()
          expect(() => new EmptyActionDispatcher({ buildUuid: { what: 'is' } })).to.throw()

          expect(() => new EmptyActionDispatcher({ buildUuid: () => {} })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ buildUuid: 'none' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ buildUuid: null })).to.not.throw()
        })

        it('should build UUID by default', async () => {
          const dispatcher = new EchoActionDispatcher()

          const context = await dispatcher.call('there-is-action-name')

          expect(typeof context.uuid).to.equal('string')
        })

        it('should allow disabling UUIDs', async () => {
          const dispatcher = new EchoActionDispatcher({ buildUuid: null })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.uuid).to.equal(null)
        })

        it('should allow changing UUID implementation', async () => {
          const dispatcher = new EchoActionDispatcher({ buildUuid: () => 'some-random-uuid' })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.uuid).to.equal('some-random-uuid')
        })
      })

      describe('Micro-time implementation', () => {
        it('should validate micro-time implementation', () => {
          expect(() => new EmptyActionDispatcher({ getMicroTime: 'not-a-function' })).to.throw()
          expect(() => new EmptyActionDispatcher({ getMicroTime: 999 })).to.throw()
          expect(() => new EmptyActionDispatcher({ getMicroTime: { what: 'is' } })).to.throw()

          expect(() => new EmptyActionDispatcher({ getMicroTime: () => {} })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ getMicroTime: null })).to.not.throw()
        })

        it('should use proper micro-time implementation by default', async () => {
          const dispatcher = new EchoActionDispatcher()

          const context = await dispatcher.call('there-is-action-name')

          expect(typeof context.startTime).to.equal('number')

          // It should return similar date
          expect(Math.floor(context.startTime / 1e5)).to.equal(Math.floor(Date.now() / 1e2))
        })

        it('should disable time tracking without micro-time implementation', async () => {
          const dispatcher = new EchoActionDispatcher({ getMicroTime: null })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.startTime).to.equal(null)
          expect(context.endTime).to.equal(null)
        })

        it('should allow replacing micro-time implementation', async () => {
          const dispatcher = new EchoActionDispatcher({ getMicroTime: () => 300 })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.startTime).to.equal(300)
          expect(context.endTime).to.equal(300)
        })
      })

      describe('Time tracking', () => {
        it('should validate time tracking option', () => {
          expect(() => new EmptyActionDispatcher({ trackTime: 'unknown-type' })).to.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 333 })).to.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: { a: 10 } })).to.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: () => true })).to.throw()

          expect(() => new EmptyActionDispatcher({ trackTime: true })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: false })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: null })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 'all' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 'both' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 'none' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 'start-only' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ trackTime: 'end-only' })).to.not.throw()
        })

        it('should track both start- and end-time of action by default', async () => {
          const dispatcher = new EchoActionDispatcher()

          const context = await dispatcher.call('there-is-action-name')

          expect(typeof context.startTime).to.equal('number')
          expect(typeof context.endTime).to.equal('number')
        })

        it('should track both start- and end-time of action using "all" directly', async () => {
          const dispatcher = new EchoActionDispatcher({ trackTime: 'all' })

          const context = await dispatcher.call('there-is-action-name')

          expect(typeof context.startTime).to.equal('number')
          expect(typeof context.endTime).to.equal('number')
        })

        it('should track only start-time of action using "start-only" option', async () => {
          const dispatcher = new EchoActionDispatcher({ trackTime: 'start-only' })

          const context = await dispatcher.call('there-is-action-name')

          expect(typeof context.startTime).to.equal('number')
          expect(context.endTime).to.equal(null)
        })

        it('should track only end-time of action using "end-only" option', async () => {
          const dispatcher = new EchoActionDispatcher({ trackTime: 'end-only' })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.startTime).to.equal(null)
          expect(typeof context.endTime).to.equal('number')
        })

        it('should not track time with "none" option', async () => {
          const dispatcher = new EchoActionDispatcher({ trackTime: 'none' })

          const context = await dispatcher.call('there-is-action-name')

          expect(context.startTime).to.equal(null)
          expect(context.endTime).to.equal(null)
        })
      })

      describe('Events emitted', () => {
        it('should validate list of expected emitted action events', () => {
          expect(() => new EmptyActionDispatcher({ emitActionEvents: 'bla' })).to.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: [ 3, 2, ActionStatus.CREATED ] })).to.throw()

          expect(() => new EmptyActionDispatcher({ emitActionEvents: true })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: false })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: 'all' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: 'none' })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: [ ActionStatus.CREATED ] })).to.not.throw()
          expect(() => new EmptyActionDispatcher({ emitActionEvents: [
            ActionStatus.CREATED, ActionStatus.SUCCESS, ActionStatus.ERROR
          ] })).to.not.throw()
        })
      })
    })

    describe('events', () => {
      it('should emit all events by default', async () => {
        const dispatcher = new MultiEchoActionDispatcher()

        const events = []
        const createEventListener = name => (context, value) => events.push({ name, context, value })

        dispatcher.on(ActionEvent.CREATED, createEventListener('created'))
        dispatcher.on(ActionEvent.READY, createEventListener('ready'))
        dispatcher.on(ActionEvent.EXECUTION, createEventListener('execution'))
        dispatcher.on(ActionEvent.UNKNOWN, createEventListener('unknown'))
        dispatcher.on(ActionEvent.SUCCESS, createEventListener('success'))
        dispatcher.on(ActionEvent.ERROR, createEventListener('error'))

        expect(events.length).to.equal(0)
        await dispatcher.call('unknown-action').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'unknown' ])

        events.splice(0, events.length)
        await dispatcher.call('echo').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'ready', 'execution', 'success' ])

        events.splice(0, events.length)
        await dispatcher.call('error-test').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'ready', 'execution', 'error' ])
      })

      it('should emit all events with "all" option', async () => {
        const dispatcher = new MultiEchoActionDispatcher({ emitActionEvents: 'all' })

        const events = []
        const createEventListener = name => (context, value) => events.push({ name, context, value })

        dispatcher.on(ActionEvent.CREATED, createEventListener('created'))
        dispatcher.on(ActionEvent.READY, createEventListener('ready'))
        dispatcher.on(ActionEvent.EXECUTION, createEventListener('execution'))
        dispatcher.on(ActionEvent.UNKNOWN, createEventListener('unknown'))
        dispatcher.on(ActionEvent.SUCCESS, createEventListener('success'))
        dispatcher.on(ActionEvent.ERROR, createEventListener('error'))

        expect(events.length).to.equal(0)
        await dispatcher.call('unknown-action').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'unknown' ])

        events.splice(0, events.length)
        await dispatcher.call('echo').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'ready', 'execution', 'success' ])

        events.splice(0, events.length)
        await dispatcher.call('error-test').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'ready', 'execution', 'error' ])
      })

      it('should emit only selected events with array option', async () => {
        const dispatcher = new MultiEchoActionDispatcher({ emitActionEvents: [ 'created', 'success' ] })

        const events = []
        const createEventListener = name => (context, value) => events.push({ name, context, value })

        dispatcher.on(ActionEvent.CREATED, createEventListener('created'))
        dispatcher.on(ActionEvent.READY, createEventListener('ready'))
        dispatcher.on(ActionEvent.EXECUTION, createEventListener('execution'))
        dispatcher.on(ActionEvent.UNKNOWN, createEventListener('unknown'))
        dispatcher.on(ActionEvent.SUCCESS, createEventListener('success'))
        dispatcher.on(ActionEvent.ERROR, createEventListener('error'))

        expect(events.length).to.equal(0)
        await dispatcher.call('unknown-action').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created' ])

        events.splice(0, events.length)
        await dispatcher.call('echo').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created', 'success' ])

        events.splice(0, events.length)
        await dispatcher.call('error-test').catch(() => {})
        expect(events.map(x => x.name)).to.deep.equal([ 'created' ])
      })

      it('should emit no events with "none" option', async () => {
        const dispatcher = new MultiEchoActionDispatcher({ emitActionEvents: 'none' })

        const events = []
        const createEventListener = name => (context, value) => events.push({ name, context, value })

        dispatcher.on(ActionEvent.CREATED, createEventListener('created'))
        dispatcher.on(ActionEvent.READY, createEventListener('ready'))
        dispatcher.on(ActionEvent.EXECUTION, createEventListener('execution'))
        dispatcher.on(ActionEvent.UNKNOWN, createEventListener('unknown'))
        dispatcher.on(ActionEvent.SUCCESS, createEventListener('success'))
        dispatcher.on(ActionEvent.ERROR, createEventListener('error'))

        expect(events.length).to.equal(0)
        await dispatcher.call('unknown-action').catch(() => {})
        expect(events.length).to.equal(0)

        await dispatcher.call('echo').catch(() => {})
        expect(events.length).to.equal(0)

        await dispatcher.call('error-test').catch(() => {})
        expect(events.length).to.equal(0)
      })

      it('should call prototype handlers with events enabled', async () => {
        const dispatcher = new MultiEchoActionDispatcher()

        const onCreated = dispatcher._onActionCreated = sinon.fake()
        const onReady = dispatcher._onActionReady = sinon.fake()
        const onUnknown = dispatcher._onActionUnknown = sinon.fake()
        const onExecution = dispatcher._onActionExecution = sinon.fake()
        const onSuccess = dispatcher._onActionSuccess = sinon.fake()
        const onError = dispatcher._onActionError = sinon.fake()

        function reset () {
          [ onCreated, onReady, onUnknown, onExecution, onSuccess, onError ]
            .forEach(x => x.resetHistory())
        }

        function getCalledEvents () {
          const map = {
            created: onCreated,
            ready: onReady,
            unknown: onUnknown,
            execution: onExecution,
            success: onSuccess,
            error: onError
          }

          return Object.keys(map).filter(key => map[key].called)
        }

        await dispatcher.call('unknown-action').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'unknown' ])
        reset()

        await dispatcher.call('echo').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'ready', 'execution', 'success' ])
        reset()

        await dispatcher.call('error-test').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'ready', 'execution', 'error' ])
        reset()
      })

      it('should call prototype handlers despite fact of emitActionEvents option disabled', async () => {
        const dispatcher = new MultiEchoActionDispatcher({ emitActionEvents: 'none' })

        const onCreated = dispatcher._onActionCreated = sinon.fake()
        const onReady = dispatcher._onActionReady = sinon.fake()
        const onUnknown = dispatcher._onActionUnknown = sinon.fake()
        const onExecution = dispatcher._onActionExecution = sinon.fake()
        const onSuccess = dispatcher._onActionSuccess = sinon.fake()
        const onError = dispatcher._onActionError = sinon.fake()

        function reset () {
          [ onCreated, onReady, onUnknown, onExecution, onSuccess, onError ]
            .forEach(x => x.resetHistory())
        }

        function getCalledEvents () {
          const map = {
            created: onCreated,
            ready: onReady,
            unknown: onUnknown,
            execution: onExecution,
            success: onSuccess,
            error: onError
          }

          return Object.keys(map).filter(key => map[key].called)
        }

        await dispatcher.call('unknown-action').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'unknown' ])
        reset()

        await dispatcher.call('echo').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'ready', 'execution', 'success' ])
        reset()

        await dispatcher.call('error-test').catch(() => {})
        expect(getCalledEvents()).to.deep.equal([ 'created', 'ready', 'execution', 'error' ])
        reset()
      })
    })

    describe('execution', () => {
      it('should throw error on call, when dispatcher is not ready', async () => {
        class NotReadyDispatcher extends EchoActionDispatcher {
          isReady () { return false }
        }

        const dispatcher = new NotReadyDispatcher()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('action-name').then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(ServiceActionDispatcherNotReadyError)
      })

      it('should check if action is supported', async () => {
        const dispatcher = new MultiEchoActionDispatcher()

        const onSuccess1 = sinon.fake()
        const onError1 = sinon.fake()
        await dispatcher.call('echo').then(onSuccess1, onError1)
        expect(onSuccess1.called).to.equal(true)
        expect(onError1.called).to.equal(false)

        const onSuccess2 = sinon.fake()
        const onError2 = sinon.fake()
        await dispatcher.call('unknown-action').then(onSuccess2, onError2)
        expect(onSuccess2.called).to.equal(false)
        expect(onError2.called).to.equal(true)
        expect(onError2.lastArg).to.be.instanceOf(ServiceActionNotFoundError)
      })

      it('should be run processing actions in proper order while executing (synchronously)', async () => {
        class ProcessedEchoActionDispatcher extends EchoActionDispatcher {
          _processAction (actionContext) {
            actionContext.processed = true
          }

          _preExecuteAction (actionContext) {
            actionContext.preExecuted = actionContext.processed
          }

          _executeAction (actionContext) {
            actionContext.executed = actionContext.preExecuted

            return super._executeAction(actionContext)
          }
        }

        const dispatcher = new ProcessedEchoActionDispatcher()
        const result = await dispatcher.call('echo')

        expect(result.processed).to.equal(true)
        expect(result.preExecuted).to.equal(true)
        expect(result.executed).to.equal(true)
      })

      it('should be run processing actions in proper order while executing (async)', async () => {
        class AsyncProcessedEchoActionDispatcher extends EchoActionDispatcher {
          async _processAction (actionContext) {
            await tick()
            actionContext.processed = true
          }

          async _preExecuteAction (actionContext) {
            await tick()
            actionContext.preExecuted = actionContext.processed
          }

          _executeAction (actionContext) {
            actionContext.executed = actionContext.preExecuted

            return super._executeAction(actionContext)
          }
        }

        const dispatcher = new AsyncProcessedEchoActionDispatcher()
        const result = await dispatcher.call('echo')

        expect(result.processed).to.equal(true)
        expect(result.preExecuted).to.equal(true)
        expect(result.executed).to.equal(true)
      })

      it('should process result using _processResult method', async () => {
        class EchoActionDispatcherWithProcessedResult extends EchoActionDispatcher {
          _processResult (result) {
            return {
              code: 200,
              result: result
            }
          }
        }

        const dispatcher = new EchoActionDispatcherWithProcessedResult()

        const onSuccess = sinon.fake()
        dispatcher.on(ActionEvent.SUCCESS, onSuccess)

        const result = await dispatcher.call('echo')

        // Check event
        expect(onSuccess.called).to.equal(true)
        expect(typeof onSuccess.lastArg === 'object' && !!onSuccess.lastArg).to.equal(true)
        expect(onSuccess.lastArg.code).to.equal(200)
        expect(onSuccess.lastArg.result.name).to.equal('echo')

        // Check result
        expect(typeof result === 'object' && !!result).to.equal(true)
        expect(result.code).to.equal(200)
        expect(result.result.name).to.equal('echo')
      })

      it('should handle errors (in call) from isReady method', async () => {
        class BrokenDispatcher extends EchoActionDispatcher {
          isReady () {
            throw new Error('Meeeh')
          }
        }

        const dispatcher = new BrokenDispatcher()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('action-name').then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(Error)
        expect(onError.lastArg.message).to.equal('Meeeh')
      })

      it('should handle errors (in call) from _executeAction method', async () => {
        class BrokenDispatcher extends EchoActionDispatcher {
          _executeAction () {
            throw new Error('Meeeh')
          }
        }

        const dispatcher = new BrokenDispatcher()

        const onSuccess = sinon.fake()
        const onError = sinon.fake()

        await dispatcher.call('action-name').then(onSuccess, onError)

        expect(onSuccess.called).to.equal(false)
        expect(onError.called).to.equal(true)
        expect(onError.lastArg).to.be.instanceOf(Error)
        expect(onError.lastArg.message).to.equal('Meeeh')
      })

      it('should accept parent UUID', async () => {
        const dispatcher = new EchoActionDispatcher()

        const context1 = await dispatcher.call('there-is-action-name', undefined, { parentUuid: 'blabla' })
        expect(context1.parentUuid).to.equal('blabla')

        const context2 = await dispatcher.call('there-is-action-name')
        expect(context2.parentUuid).to.equal(null)
      })
    })

    describe('miscellanous', () => {
      it('should be healthy only when it\'s ready (by default)', () => {
        class NotReadyDispatcher extends EchoActionDispatcher {
          isReady () { return false }
        }

        expect(new EchoActionDispatcher().isHealthy()).to.equal(true)
        expect(new NotReadyDispatcher().isHealthy()).to.equal(false)
      })
    })
  })
})
