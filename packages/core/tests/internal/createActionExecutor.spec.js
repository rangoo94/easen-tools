const expect = require('chai').expect
const sinon = require('sinon')

const Bluebird = require('bluebird')

const ActionStatus = require('../../src/constants').ActionStatus
const ImmediateResult = require('../../src/ImmediateResult')
const createActionExecutor = require('../../src/internal/createActionExecutor')
const ServiceActionNotFoundError = require('../../src/ServiceError/ServiceActionNotFoundError')

const waitTick = () => new Promise(resolve => setTimeout(resolve))
const waitTickBluebird = () => new Bluebird(resolve => setTimeout(resolve))

describe('core', () => {
  describe('createActionExecutor', () => {
    it('should throw error without required options', () => {
      expect(() => createActionExecutor({})).to.throw()
      expect(() => createActionExecutor({ createContext: () => ({}) })).to.throw()
    })

    it('should create a function', () => {
      const fn = createActionExecutor({
        createContext: () => ({}),
        execute: () => true
      })

      expect(typeof fn).to.equal('function')
    })

    it('should return a valid promise', async () => {
      const fn = createActionExecutor({
        createContext: () => ({}),
        execute: () => 'blabla'
      })

      const result = fn()

      expect(typeof result.then).to.equal('function')

      const resolvedResult = await result

      expect(resolvedResult).to.equal('blabla')
    })

    it('should pass execution data for context function', async () => {
      const createContext = sinon.fake.returns({})

      const fn = createActionExecutor({
        createContext: createContext,
        execute: () => true
      })

      await fn('some-name', { par: 'ams', papa: 'dams' }, { some: 'meta', data: null })

      expect(createContext.called).to.equal(true)
      expect(createContext.calledWith(
        'some-name',
        { par: 'ams', papa: 'dams' },
        { some: 'meta', data: null }
      )).to.equal(true)
    })

    it('should pass context to executor', async () => {
      const ctx = { a: 10, b: 20, c: 30 }
      const executor = sinon.fake.returns(true)

      const fn = createActionExecutor({
        createContext: () => ctx,
        execute: executor
      })

      await fn()

      expect(executor.called).to.equal(true)
      expect(executor.calledWith(ctx)).to.equal(true)
    })

    it('should pass context to each function down', async () => {
      const ctx = { a: 10, b: 20, c: 30 }
      const processor = sinon.fake.returns(null)
      const preExecutor = sinon.fake.returns(null)
      const executor = sinon.fake.returns(null)
      const finalizer = sinon.fake.returns(null)
      const resultProcessor = sinon.fake.returns(null)

      const fn = createActionExecutor({
        createContext: () => ctx,
        process: processor,
        preExecute: preExecutor,
        execute: executor,
        processResult: resultProcessor,
        finalizeContext: finalizer
      })

      await fn()

      expect(processor.called).to.equal(true)
      expect(processor.calledWith(ctx)).to.equal(true)

      expect(preExecutor.called).to.equal(true)
      expect(preExecutor.calledWith(ctx)).to.equal(true)

      expect(executor.called).to.equal(true)
      expect(executor.calledWith(ctx)).to.equal(true)

      expect(finalizer.called).to.equal(true)
      expect(finalizer.calledWith(ctx, null)).to.equal(true)

      expect(resultProcessor.called).to.equal(true)
      expect(resultProcessor.calledWith(null, ctx)).to.equal(true)
    })

    it('should properly execute function', async () => {
      const fn = createActionExecutor({
        createContext: (name, params) => ({ name, params }),
        execute: (ctx) => ctx.params.a + ctx.params.b
      })

      const result = await fn('bla', { a: 10, b: 20 })

      expect(result).to.equal(30)
    })

    it('should allow mutating context', async () => {
      const createContext = (name, params) => ({
        name: name,
        params: {
          a: params.a * 5,
          b: params.b * 5
        }
      })

      const mutateContext = ctx => {
        ctx.params.a *= 2
        ctx.params.b *= 3
      }

      const fn = createActionExecutor({
        createContext: createContext,
        process: mutateContext,
        preExecute: mutateContext,
        execute: (ctx) => ctx.params.a + ctx.params.b
      })

      const result = await fn('bla', { a: 10, b: 20 })

      expect(result).to.equal(1100)
    })

    it('should allow processing result', async () => {
      const createContext = (name, params) => ({
        name: name,
        params: params
      })

      const fn = createActionExecutor({
        createContext: createContext,
        execute: (ctx) => ctx.params.a + ctx.params.b,
        processResult: (value, ctx) => `${value} ${ctx.name}`
      })

      const result = await fn('apples', { a: 10, b: 20 })

      expect(result).to.equal('30 apples')
    })

    it('should handle asynchronous paths', async () => {
      const createContext = (name, params) => ({
        name: name,
        params: params
      })

      const mutateContextAsynchronously = ctx => {
        return new Promise((resolve) => setTimeout(() => {
          ctx.params.a *= 2
          ctx.params.b *= 3

          resolve()
        }))
      }

      const fn = createActionExecutor({
        createContext: createContext,
        process: mutateContextAsynchronously,
        preExecute: mutateContextAsynchronously,
        execute: (ctx) => ctx.params.a + ctx.params.b
      })

      const result = await fn('bla', { a: 10, b: 20 })

      expect(result).to.equal(220)
    })

    it('should allow only selected methods', async () => {
      const isActionSupported = name => name === 'allowedName'
      const createContext = (name, params) => ({ name: name, params: params })


      const fn = createActionExecutor({
        isActionSupported: isActionSupported,
        createContext: createContext,
        execute: (ctx) => ctx.params.a + ctx.params.b
      })

      const success = sinon.fake()
      const failure = sinon.fake()

      await fn('bla', { a: 10, b: 20 })
        .then(success, failure)
        .catch(() => {})

      expect(success.called).to.equal(false)
      expect(failure.called).to.equal(true)
      expect(failure.lastArg instanceof ServiceActionNotFoundError).to.equal(true)

      const success2 = sinon.fake()
      const failure2 = sinon.fake()

      await fn('allowedName', { a: 10, b: 20 })
        .then(success2, failure2)
        .catch(() => {})

      expect(success2.called).to.equal(true)
      expect(failure2.called).to.equal(false)
      expect(success2.lastArg).to.equal(30)
    })

    it('should emit events on each step of action execution (success)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        execute: (ctx) => ctx.a + ctx.b
      })

      await fn('bla')

      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.READY, context: context, value: undefined },
        { state: ActionStatus.EXECUTION, context: context, value: undefined },
        { state: ActionStatus.SUCCESS, context: context, value: 30 },
      ])
    })

    it('should emit events on each step of action execution (unknown action)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const isActionSupported = name => name === 'allowedName'

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn = createActionExecutor({
        isActionSupported: isActionSupported,
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        execute: (ctx) => ctx.a + ctx.b
      })

      await fn('bla').catch(() => {})

      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.UNKNOWN, context: context, value: undefined }
      ])
    })

    it('should emit events on each step of action execution (failure)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        execute: (ctx) => ctx.unknownProperty.a + ctx.b
      })

      await fn('bla').catch(() => {})

      expect(events.length).to.equal(4)
      expect(events[3].value instanceof TypeError).to.equal(true)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.READY, context: context, value: undefined },
        { state: ActionStatus.EXECUTION, context: context, value: undefined },
        { state: ActionStatus.ERROR, context: context, value: events[3].value }
      ])
    })

    it('should emit events on each step of action execution (faster failure)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn1 = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        process: (ctx) => ctx.unknownProperty.a + ctx.b,
        execute: (ctx) => ctx.a + ctx.b
      })

      await fn1('bla').catch(() => {})

      expect(events.length).to.equal(2)
      expect(events[1].value instanceof TypeError).to.equal(true)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.ERROR, context: context, value: events[1].value }
      ])

      const fn2 = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        preExecute: (ctx) => ctx.unknownProperty.a + ctx.b,
        execute: (ctx) => ctx.a + ctx.b
      })

      events.splice(0, events.length)
      await fn2('bla').catch(() => {})

      expect(events.length).to.equal(3)
      expect(events[2].value instanceof TypeError).to.equal(true)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.READY, context: context, value: undefined },
        { state: ActionStatus.ERROR, context: context, value: events[2].value }
      ])
    })

    it('should return result before action execution', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        process: () => { throw new ImmediateResult('something') },
        execute: (ctx) => ctx.a + ctx.b
      })

      const result1 = await fn('bla')

      expect(result1).to.equal('something')
      expect(events.length).to.equal(2)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.SUCCESS, context: context, value: 'something' }
      ])

      const asyncFn = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        preExecute: waitTick,
        process: () => { throw new ImmediateResult('something') },
        execute: (ctx) => ctx.a + ctx.b
      })

      events.splice(0, events.length)
      const result2 = await asyncFn('bla')

      expect(result2).to.equal('something')
      expect(events.length).to.equal(2)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.SUCCESS, context: context, value: 'something' }
      ])
    })

    it('should process immediate result', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const events = []
      const onActionStateChange = (state, context, value) => events.push({
        state: state,
        context: context,
        value: value
      })

      const fn = createActionExecutor({
        createContext: createContext,
        onActionStateChange: onActionStateChange,
        process: () => { throw new ImmediateResult('something') },
        processResult: (result) => `${result} there`,
        execute: (ctx) => ctx.a + ctx.b
      })

      const result = await fn('bla')

      expect(result).to.equal('something there')
      expect(events.length).to.equal(2)
      expect(events).to.deep.equal([
        { state: ActionStatus.CREATED, context: context, value: undefined },
        { state: ActionStatus.SUCCESS, context: context, value: 'something there' }
      ])
    })

    it('should choose proper Promise implementation', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        Promise: Bluebird,
        createContext: createContext,
        processResult: (result) => `${result} there`,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise1 = fn('bla')
      await promise1

      expect(promise1 instanceof Bluebird).to.equal(true)

      const asyncFn = createActionExecutor({
        Promise: Bluebird,
        createContext: createContext,
        preExecute: waitTick,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise2 = asyncFn('bla')
      await promise2

      expect(promise2 instanceof Bluebird).to.equal(true)
    })

    it('could reuse Promise implementation sent inside', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn1 = createActionExecutor({
        ensurePromiseImplementation: false,
        Promise: Bluebird,
        preExecute: waitTick, // it will use native Promise
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise1 = fn1('bla')
      await promise1

      expect(promise1 instanceof Promise).to.equal(true)

      const fn2 = createActionExecutor({
        ensurePromiseImplementation: false,
        Promise: Promise,
        preExecute: waitTickBluebird, // it will use Bluebird promises
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise2 = fn2('bla')
      await promise2

      expect(promise2 instanceof Bluebird).to.equal(true)
    })

    it('should attach context to promise (success)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')

      expect(promise.context).to.equal(context)
      await promise
      expect(promise.context).to.equal(context)
    })

    it('should not attach context to promise (success)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        includeContext: false,
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')

      expect(promise.context).to.equal(undefined)
      await promise
      expect(promise.context).to.equal(undefined)
    })

    it('should attach context to promise (unknown action)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context
      const isActionSupported = () => false

      const fn = createActionExecutor({
        isActionSupported: isActionSupported,
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')
      promise.catch(() => {})

      expect(promise.context).to.equal(context)
      await promise.catch(() => {})
      expect(promise.context).to.equal(context)
    })

    it('should not attach context to promise (unknown action)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context
      const isActionSupported = () => false

      const fn = createActionExecutor({
        includeContext: false,
        isActionSupported: isActionSupported,
        createContext: createContext,
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')
      promise.catch(() => {})

      expect(promise.context).to.equal(undefined)
      await promise.catch(() => {})
      expect(promise.context).to.equal(undefined)
    })

    it('should attach context to promise (failure)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        createContext: createContext,
        preExecute: () => { throw new Error() },
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')
      promise.catch(() => {})

      expect(promise.context).to.equal(context)
      await promise.catch(() => {})
      expect(promise.context).to.equal(context)
    })

    it('should not attach context to promise (failure)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        includeContext: false,
        createContext: createContext,
        preExecute: () => { throw new Error() },
        execute: (ctx) => ctx.a + ctx.b
      })

      const promise = fn('bla')
      promise.catch(() => {})

      expect(promise.context).to.equal(undefined)
      await promise.catch(() => {})
      expect(promise.context).to.equal(undefined)
    })


    it('should ignore uncaught error (within emitting events)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context

      const fn = createActionExecutor({
        includeContext: false,
        createContext: createContext,
        onActionStateChange: () => { throw new Error('Meh.') },
        execute: (ctx) => ctx.a + ctx.b
      })

      const result = await fn('bla')

      expect(result).to.equal(30)
    })

    it('should handle uncaught error (within emitting events)', async () => {
      const context = { a: 10, b: 20 }
      const createContext = () => context
      const onUncaughtError = sinon.fake()

      const fn = createActionExecutor({
        includeContext: false,
        createContext: createContext,
        onActionStateChange: () => { throw new Error('Meh.') },
        onUncaughtError: onUncaughtError,
        execute: (ctx) => ctx.a + ctx.b
      })

      const result = await fn('bla')

      expect(result).to.equal(30)
      expect(onUncaughtError.called).to.equal(true)
      expect(onUncaughtError.lastArg instanceof Error).to.equal(true)
      expect(onUncaughtError.lastArg.message).to.equal('Meh.')
    })
  })
})
