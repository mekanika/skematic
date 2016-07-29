/* eslint-env node, mocha */

const expect = require('chai').expect
const DataTypes = require('../src/datatypes')

const typeKeys = Object.keys(DataTypes)
let testedKeys = []

/**
  DataTypes use a common structure, with some minor parameter tweaks.
  The following are common tests that apply to all DataTypes.

  @param {String} type The uppercase TYPE to test
  @param {Object[]} opts Array of {field: paramVal} to pass to TYPE()
*/

function invoke (type, opts) {
  testedKeys.push(type)

  it(type + ': key is set on raw and ()', () => {
    const dt = DataTypes[type]
    expect(dt.key).to.equal(type)
    expect(dt(opts).key).to.equal(type)
  })

  if (opts) {
    opts.forEach(opt => {
      let key = ''
      for (let k in opt) key = k

      it(`${type}: can invoke with option (${key}:${opt[key]})`, () => {
        const out = DataTypes[type](opt[key])
        expect(out[key]).to.equal(opt[key])
      })
    })
  }
}

describe('DataTypes', () => {
  invoke('STRING', [{length: 32}])
  invoke('CHAR', [{length: 5}])
  invoke('TEXT')
  invoke('INTEGER')
  invoke('DECIMAL')
  invoke('DOUBLE')
  invoke('REAL')
  invoke('FLOAT')
  invoke('UUID')
  invoke('ARRAY')
  invoke('HSTORE')
  invoke('BOOLEAN')
  invoke('TIME')
  invoke('DATE')
  invoke('BYTEA')
  invoke('JSON')
  invoke('JSONB')
  invoke('GEOMETRY')
  invoke('GEOGRAPHY')

  // ENUM has a required input
  testedKeys.push('ENUM')
  it('ENUM: key is set on ([vals])', () => {
    const dt = DataTypes.ENUM
    expect(dt.key).to.equal('ENUM')
    const out = dt(['hi'])
    expect(out.key).to.equal('ENUM')
    expect(out.values).to.include('hi')
  })

  // RANGE has a required input
  testedKeys.push('RANGE')
  it('RANGE: key is set on raw and (type)', () => {
    const dt = DataTypes.RANGE
    expect(dt.key).to.equal('RANGE')
    expect(dt('na').key).to.equal('RANGE')
  })

  // Spit out a missing test message if tests are missing for a DataType
  typeKeys.forEach(k => {
    if (testedKeys.indexOf(k) < 0) {
      it.skip('Missing DataType tests for ' + k)
    }
  })
})
