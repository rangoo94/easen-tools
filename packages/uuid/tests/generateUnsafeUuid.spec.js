const expect = require('chai').expect
const hasUniqueStringGeneration = require('./helpers/hasUniqueStringGeneration')

// Retrieve tested function
const generateUnsafeUuid = require('../src/generateUnsafeUuid')

describe('uuid', () => {
  describe('generateUnsafeUuid', () => {
    it ('should generate unique UUIDs', () => {
      expect(hasUniqueStringGeneration(generateUnsafeUuid, 3e5)).to.equal(true)
    })

    it ('should have valid UUID v4 format', () => {
      for (let i = 0; i < 1e4; i++) {
        expect(generateUnsafeUuid()).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      }
    })
  })
})
