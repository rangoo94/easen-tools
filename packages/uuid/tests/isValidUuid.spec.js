const expect = require('chai').expect

// Retrieve tested function
const isValidUuid = require('../src/isValidUuid')

describe('uuid', () => {
  describe('isValidUuid', () => {
    it ('should disallow types different than string', () => {
      expect(isValidUuid([ 10, 30 ])).to.equal(false)
      expect(isValidUuid({})).to.equal(false)
      expect(isValidUuid({ a: 'b' })).to.equal(false)
      expect(isValidUuid(33)).to.equal(false)
      expect(isValidUuid(null)).to.equal(false)
      expect(isValidUuid(undefined)).to.equal(false)
      expect(isValidUuid(true)).to.equal(false)
      expect(isValidUuid(false)).to.equal(false)
    })

    it ('should fail completely invalid strings', () => {
      expect(isValidUuid('aaaa')).to.equal(false)
      expect(isValidUuid('aaaa-bbbb')).to.equal(false)
      expect(isValidUuid('aaaa-bbbb-cccc')).to.equal(false)
      expect(isValidUuid('aaaa-bbbb-cccc-dddd')).to.equal(false)
      expect(isValidUuid('nothing there')).to.equal(false)
    })

    it ('should check for UUID v4 recognition bits', () => {
      expect(isValidUuid('aada7be3-4d11-4224-a720-8e703b8d12d8')).to.equal(true)
      expect(isValidUuid('aada7be3-4d11-4224-c720-8e703b8d12d8')).to.equal(false)
      expect(isValidUuid('aada7be3-4d11-4224-7720-8e703b8d12d8')).to.equal(false)
      expect(isValidUuid('aada7be3-4d11-3224-7720-8e703b8d12d8')).to.equal(false)
      expect(isValidUuid('aada7be3-4d11-3224-a720-8e703b8d12d8')).to.equal(false)
    })

    it ('should disallow invalid HEX characters', () => {
      expect(isValidUuid('gada7be3-4d11-4224-a720-8e703b8d12d8')).to.equal(false)
    })

    it ('should have valid UUID v4 format', () => {
      expect(isValidUuid('aada7be3-4d11-4224-a720-8e703b8d12d8')).to.equal(true)
    })

    it('should work with upper-case letters', () => {
      expect(isValidUuid('AADA7BE3-4D11-4224-A720-8E703B8D12D8')).to.equal(true)
      expect(isValidUuid('AADA7BE3-4D11-4224-C720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-4224-7720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-3224-7720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-3224-A720-8E703B8D12D8')).to.equal(false)
    })

    it('should work with mixed lower-case and upper-case letters', () => {
      expect(isValidUuid('AADA7BE3-4D11-4224-a720-8E703B8D12D8')).to.equal(true)
      expect(isValidUuid('AADA7BE3-4D11-4224-c720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-4224-7720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-3224-7720-8E703B8D12D8')).to.equal(false)
      expect(isValidUuid('AADA7BE3-4D11-3224-a720-8E703B8D12D8')).to.equal(false)
    })
  })
})
