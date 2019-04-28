const expect = require('chai').expect
const hasUniqueBinaryGeneration = require('./helpers/hasUniqueBinaryGeneration')

// Retrieve tested function
const generateBinaryUuid = require('../src/generateBinaryUuid')

describe('uuid', () => {
  describe('generateBinaryUuid', () => {
    it ('should generate unique binary UUIDs', () => {
      expect(hasUniqueBinaryGeneration(generateBinaryUuid)).to.equal(true)
    })

    it ('should generate 128-bit array', () => {
      for (let i = 0; i < 1e3; i++) {
        const uuid = generateBinaryUuid()

        expect(uuid.length).to.equal(16)
        expect(uuid.filter(x => x >= 0 && x < 256).length).to.equal(16)
      }
    })

    it ('should have UUID determine bits set correctly', () => {
      for (let i = 0; i < 1e3; i++) {
        const uuid = generateBinaryUuid()

        // Version 4
        expect(uuid[6] >> 4).to.equal(4)

        // Check byte
        expect(uuid[8] >> 4).to.be.greaterThan(7)
        expect(uuid[8] >> 4).to.be.lessThan(12)
      }
    })
  })
})
