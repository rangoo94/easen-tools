const expect = require('chai').expect
const sinon = require('sinon')

const Bluebird = require('bluebird')

const ServiceBrokerBuilder = require('../src/ServiceBrokerBuilder')
const ServiceBroker = require('../src/ServiceBroker')
const ActionDispatcher = require('../src/ActionDispatcher')
const annotateHandler = require('../src/utils/annotateHandler')

function tick () {
  return new Promise(setTimeout)
}

describe('core', () => {
  describe('ServiceBroker & ServiceBrokerBuilder', () => {
    it('should throw error without constructor', () => {
      expect(() => ServiceBrokerBuilder()).to.throw()
    })

    it('should create ServiceBroker', () => {
      const builder = new ServiceBrokerBuilder()
      const broker = builder.createBroker()

      expect(broker).to.be.instanceOf(ServiceBroker)
      expect(broker).to.be.instanceOf(ActionDispatcher)
    })

    it('should be able to create multiple brokers from single builder', async () => {
      const builder = new ServiceBrokerBuilder()
        .registerAction('action1', () => 1)

      const broker1 = builder.createBroker()
      const broker2 = builder.createBroker()
      const broker3 = builder
        .registerAction('action2', () => 2)
        .createBroker()

      // It should have different instance
      expect(broker1).to.not.equal(broker2)
      expect(broker1).to.not.equal(broker3)
      expect(broker2).to.not.equal(broker3)

      // 'action2' should be available only in broker3

      const onError1 = sinon.fake()
      const onError2 = sinon.fake()
      const onError3 = sinon.fake()

      await broker1.call('action2').catch(onError1)
      await broker2.call('action2').catch(onError2)
      await broker3.call('action2').catch(onError3)

      expect(onError1.called).to.equal(true)
      expect(onError2.called).to.equal(true)
      expect(onError3.called).to.equal(false)

      // 'action2' should be available in all brokers

      const onSuccess1 = sinon.fake()
      const onSuccess2 = sinon.fake()
      const onSuccess3 = sinon.fake()

      await broker1.call('action1').then(onSuccess1)
      await broker2.call('action1').then(onSuccess2)
      await broker3.call('action1').then(onSuccess3)

      expect(onSuccess1.called).to.equal(true)
      expect(onSuccess2.called).to.equal(true)
      expect(onSuccess3.called).to.equal(true)
    })

    it('should return proper list of available actions', () => {
      function noop () {}
      function handler () { return 1 }

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop)
        .registerProcessingMiddleware('actionName', noop)
        .registerNegotiatingMiddleware(noop)
        .registerAction('actionName', handler)
        .registerAction('actionName2', handler)
        .createBroker()

      expect(broker.getActionsList()).to.deep.equal([ 'actionName', 'actionName2' ])
    })

    it('should return proper list of available actions (with unused middlewares)', () => {
      function noop () {}
      function handler () { return 1 }

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop)
        .registerProcessingMiddleware('anotherActionName', noop)
        .registerNegotiatingMiddleware(noop)
        .registerAction('actionName', handler)
        .registerAction('actionName2', handler)
        .createBroker()

      expect(broker.getActionsList()).to.deep.equal([ 'actionName', 'actionName2' ])
    })

    it('should return empty action annotations for unknown one', () => {
      function noop () {}
      function handler () { return 1 }

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop, { $gdpr: true })
        .registerProcessingMiddleware('anotherActionName', noop, { $cache: true, $something: true })
        .registerNegotiatingMiddleware(noop, { $anything: true })
        .registerAction('actionName', handler, { $a: 'blue' })
        .registerAction('actionName2', handler, { $g: { y: 10 } })
        .createBroker()

      expect(broker.getActionAnnotations('unknownActionName')).to.deep.equal([])
    })

    it('should return action annotations in correct order', () => {
      function noop () {}
      function handler () { return 1 }

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop, { $gdpr: true })
        .registerProcessingMiddleware('anotherActionName', noop, { $cache: true, $something: true })
        .registerNegotiatingMiddleware(noop, { $anything: true })
        .registerNegotiatingMiddleware('actionName2', noop, { $anything: true })
        .registerAction('actionName', handler, { $a: 'blue' })
        .registerAction('actionName2', handler, { g: { y: 10 } })
        .createBroker()

      expect(broker.getActionAnnotations('actionName')).to.deep.equal([
        { $anything: true },
        { $gdpr: true },
        { $a: 'blue' }
      ])

      expect(broker.getActionAnnotations('actionName2')).to.deep.equal([
        { $anything: true },
        { $anything: true },
        { $gdpr: true },
        { g: { y: 10 } }
      ])
    })

    it('should ignore empty middleware annotations, but never handler annotations', () => {
      function noop () {}
      function handler () { return 1 }

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop)
        .registerProcessingMiddleware('anotherActionName', noop, { $gdpr: true })
        .registerNegotiatingMiddleware(noop, {})
        .registerNegotiatingMiddleware('actionName2', noop, { $g: true })
        .registerAction('actionName', handler)
        .registerAction('actionName2', handler)
        .createBroker()

      expect(broker.getActionAnnotations('actionName')).to.deep.equal([
        {}
      ])

      expect(broker.getActionAnnotations('actionName2')).to.deep.equal([
        { $g: true },
        {}
      ])
    })

    it('should detect annotations already injected to function', () => {
      function noop () {}
      function handler () { return 1 }

      const annotatedNoop = annotateHandler(() => {}, { $noop: true, something: 'cache' })

      const broker = new ServiceBrokerBuilder()
        .registerExecutionMiddleware(noop)
        .registerProcessingMiddleware('anotherActionName', noop, { $gdpr: true })
        .registerProcessingMiddleware(annotatedNoop)
        .registerProcessingMiddleware(annotatedNoop, { $gdpr: true })
        .registerNegotiatingMiddleware(noop, {})
        .registerNegotiatingMiddleware('actionName2', noop, { $g: true })
        .registerAction('actionName', handler)
        .registerAction('actionName2', handler, { a: 10 })
        .createBroker()

      expect(broker.getActionAnnotations('actionName')).to.deep.equal([
        { $noop: true, something: 'cache' },
        { $noop: true, something: 'cache', $gdpr: true },
        {}
      ])

      expect(broker.getActionAnnotations('actionName2')).to.deep.equal([
        { $noop: true, something: 'cache' },
        { $noop: true, something: 'cache', $gdpr: true },
        { $g: true },
        { a: 10 }
      ])
    })

    describe('Execution', () => {
      it('should reject on unknown action', async () => {
        const broker1 = new ServiceBrokerBuilder()
          .createBroker()

        const onSuccess1 = sinon.fake()
        const onError1 = sinon.fake()
        await broker1.call('unknown').then(onSuccess1, onError1)
        expect(onSuccess1.called).to.equal(false)
        expect(onError1.called).to.equal(true)
        expect(onError1.lastArg.name).to.equal('ServiceActionNotFoundError')

        const broker2 = new ServiceBrokerBuilder()
          .registerAction('known', () => 1)
          .createBroker()

        const onSuccess2 = sinon.fake()
        const onError2 = sinon.fake()
        await broker2.call('unknown').then(onSuccess2, onError2)
        expect(onSuccess1.called).to.equal(false)
        expect(onError1.called).to.equal(true)
        expect(onError1.lastArg.name).to.equal('ServiceActionNotFoundError')
      })

      it('should run single middlewares in correct order (synchronous)', async () => {
        function process (context) {
          context.step1 = true
        }

        function negotiate (context) {
          context.step2 = context.step1
        }

        function execute (context) {
          context.step3 = context.step2
        }

        function handler (context) {
          return context.step3
        }

        const broker = new ServiceBrokerBuilder()
          .registerExecutionMiddleware(execute)
          .registerProcessingMiddleware(process)
          .registerNegotiatingMiddleware(negotiate)
          .registerAction('actionName', handler)
          .createBroker()

        // .registerExecutionMiddleware() // TODO: Fix DX: Cannot read property 'replace' of undefined
        // .registerExecutionMiddleware('') // TODO: Fix DX: Cannot read property '$annotations' of undefined
        // TODO: Other functions also ignore type of values

        const result = await broker.call('actionName')

        expect(result).to.equal(true)
      })

      it('should run single middlewares in correct order (async)', async () => {
        async function process (context) {
          await tick()
          context.step1 = true
        }

        async function negotiate (context) {
          context.step2 = context.step1
        }

        async function execute (context) {
          await tick()
          context.step3 = context.step2
        }

        async function handler (context) {
          return context.step3
        }

        const broker = new ServiceBrokerBuilder()
          .registerExecutionMiddleware(execute)
          .registerProcessingMiddleware(process)
          .registerNegotiatingMiddleware(negotiate)
          .registerAction('actionName', handler)
          .createBroker()

        const result = await broker.call('actionName')

        expect(result).to.equal(true)
      })

      it('should correctly choose middlewares for action', async () => {
        const fn1 = context => { context.params.a *= 2 }
        const fn2 = context => { context.params.a *= 3 }
        const fn3 = context => { context.params.a *= 7 }
        const fn4 = context => { context.params.a *= 11 }
        const handler1 = context => context.params.a * 13
        const handler2 = context => context.params.a * 17

        const broker = new ServiceBrokerBuilder()
          .registerExecutionMiddleware(fn1)
          .registerProcessingMiddleware(fn2)
          .registerProcessingMiddleware('actionName1', fn3)
          .registerNegotiatingMiddleware('actionName2', fn4)
          .registerNegotiatingMiddleware('actionName2', fn4)
          .registerNegotiatingMiddleware('actionName1', fn4)
          .registerAction('actionName1', handler1)
          .registerAction('actionName2', handler2)
          .createBroker()

        const result1 = await broker.call('actionName1', { a: 1 })
        const result2 = await broker.call('actionName2', { a: 1 })

        // actionName1: a * (fn1) 2 * (fn2) 3 * (fn3) 7 * (fn4) 11 * (handler1) 13
        expect(result1).to.equal(2 * 3 * 7 * 11 * 13)

        // actionName2: a * (fn1) 2 * (fn2) 3 * (fn4) 11 * (fn4) 11 * (handler2) 17
        expect(result2).to.equal(2 * 3 * 11 * 11 * 17)
      })
    })

    describe('Options', () => {
      it('should return proper promise type', async () => {
        const broker1 = new ServiceBrokerBuilder({ Promise: Bluebird })
          .createBroker()
        const broker2 = new ServiceBrokerBuilder({ Promise: Bluebird })
          .registerAction('abc', () => 1)
          .createBroker()
        const broker3 = new ServiceBrokerBuilder()
          .createBroker({ Promise: Bluebird })
        const broker4 = new ServiceBrokerBuilder()
          .registerAction('abc', () => 1)
          .createBroker({ Promise: Bluebird })

        const brokers = [ broker1, broker2, broker3, broker4 ]

        for (const broker of brokers) {
          const onSuccess = sinon.fake()
          const onError = sinon.fake()

          const promise = broker.call('abc')

          await promise.then(onSuccess, onError)

          expect(promise).to.be.instanceOf(Bluebird)
          expect(onSuccess.called || onError.called).to.equal(true)
        }
      })

      it('should return proper promise type (2)', async () => {
        const broker1 = new ServiceBrokerBuilder({ Promise: Promise })
          .createBroker()
        const broker2 = new ServiceBrokerBuilder({ Promise: Promise })
          .registerAction('abc', () => 1)
          .createBroker()
        const broker3 = new ServiceBrokerBuilder()
          .createBroker({ Promise: Promise })
        const broker4 = new ServiceBrokerBuilder()
          .registerAction('abc', () => 1)
          .createBroker({ Promise: Promise })

        const brokers = [ broker1, broker2, broker3, broker4 ]

        for (const broker of brokers) {
          const onSuccess = sinon.fake()
          const onError = sinon.fake()

          const promise = broker.call('abc')

          await promise.then(onSuccess, onError)

          expect(promise).to.be.instanceOf(Promise)
          expect(onSuccess.called || onError.called).to.equal(true)
        }
      })
    })
  })
})
