/* eslint-env node, mocha */
const expect = require('chai').expect
const idMap = require('../src/idmap')

describe('idMap()', function () {
  const propSchema = {
    prop_id: {primaryKey: true},
    name: {type: 'string'}
  }

  const data = [ {_id: '512314', name: 'power'}, {_id: '519910', name: 'speed'} ]

  it('transposes to a primaryKey field from an idField', function () {
    const out = idMap(propSchema, data.slice(), '_id')

    expect(out).to.have.length(2)
    expect(out[0]).to.include.key('prop_id')
    expect(out[0]).to.not.include.key('_id')
  })

  it('does nothing if no primaryKey defined', function () {
    const ps = {name: {type: 'string'}}
    const out = idMap(ps, data, '_id')

    expect(out).to.eql(data)
  })

  it('does nothing if primarKey field has a `generate` field', function () {
    const ps = {prop_id: {primaryKey: true, generate: {ops: [Math.random]}}}
    const out = idMap(ps, data, '_id')
    expect(out).to.eql(data)
  })
})
