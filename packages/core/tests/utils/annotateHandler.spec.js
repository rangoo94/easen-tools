const expect = require('chai').expect

const annotateHandler = require('../../src/utils/annotateHandler')

describe('core', () => {
  describe('utils.annotateHandler', () => {
    it('should set annotations to a handler', () => {
      const handler = () => {}
      const annotatedHandler = annotateHandler(handler, { cache: true })

      expect(annotatedHandler.$annotations).to.deep.equal({ cache: true })
    })

    it('should not mutate handler', () => {
      const handler = () => {}
      const annotatedHandler = annotateHandler(handler, { cache: true })

      expect(handler.$annotations).to.equal(undefined)
      expect(annotatedHandler).to.not.equal(handler)
    })

    it('should ignore empty annotations', () => {
      const handler = () => {}
      const annotatedHandler = annotateHandler(handler, {})

      expect(annotatedHandler.$annotations).to.equal(undefined)
      expect(annotatedHandler).to.equal(handler)
    })

    it('should throw error for invalid function passed', () => {
      expect(() => annotateHandler('none')).to.throw()
      expect(() => annotateHandler('none', { cache: true })).to.throw()
    })

    it('should extend annotations', () => {
      const handler = annotateHandler(() => {}, { cache: true })
      const handler2 = annotateHandler(handler, { something: true })
      const handler3 = annotateHandler(handler2, { nothing: true })
      const handler4 = annotateHandler(handler3, { something: false })

      expect(handler.$annotations).to.deep.equal({ cache: true })
      expect(handler2.$annotations).to.deep.equal({ cache: true, something: true })
      expect(handler3.$annotations).to.deep.equal({ cache: true, something: true, nothing: true })
      expect(handler4.$annotations).to.deep.equal({ cache: true, something: false, nothing: true })
    })

    it('should replace annotations', () => {
      const handler = annotateHandler(() => {}, { cache: true }, true)
      const handler2 = annotateHandler(handler, { something: true }, true)
      const handler3 = annotateHandler(handler2, { nothing: true }, true)
      const handler4 = annotateHandler(handler3, { something: false }, true)

      expect(handler.$annotations).to.deep.equal({ cache: true })
      expect(handler2.$annotations).to.deep.equal({ something: true })
      expect(handler3.$annotations).to.deep.equal({ nothing: true })
      expect(handler4.$annotations).to.deep.equal({ something: false })
    })

    it('should call annotated handler with any number of arguments same way as original', () => {
      const handler = (...args) => args.reduce((a, b) => a + b, 0)
      const annotatedHandler = annotateHandler(handler, { cache: true })

      expect(handler(1, 2, 3, 10, 1500, 800, 54)).to.equal(2370)
      expect(annotatedHandler(1, 2, 3, 10, 1500, 800, 54)).to.equal(2370)
    })
  })
})
