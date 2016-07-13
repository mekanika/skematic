/* eslint-env node, mocha */
const expect = require('chai').expect
const is = require('../src/is')

describe('.is', function () {
  it('string', function () {
    expect(is.string('')).to.eql(true)
    expect(is.string('true')).to.eql(true)
    expect(is.string(true)).to.eql(false)
    expect(is.string(new Date())).to.eql(false)
  })

  it('integer', function () {
    expect(is.integer(0)).to.eql(true)
    expect(is.integer(-15)).to.eql(true)
    expect(is.integer(100)).to.eql(true)
    expect(is.integer(1.0)).to.eql(true)
    expect(is.integer(1.2)).to.eql(false)
    expect(is.integer(NaN)).to.eql(false)
  })

  it('number', function () {
    expect(is.number(0)).to.eql(true)
    expect(is.number(-15)).to.eql(true)
    expect(is.number(100)).to.eql(true)
    expect(is.number(1.0)).to.eql(true)
    expect(is.number(1.2)).to.eql(true)
    expect(is.number(NaN)).to.eql(false)
  })

  it('array', function () {
    expect(is.array(0)).to.eql(false)
    expect(is.array('1,2,3')).to.eql(false)
    expect(is.array(new Array())).to.eql(true) // eslint-disable-line
    expect(is.array([])).to.eql(true)
  })

  it('boolean', function () {
    expect(is.boolean(0)).to.eql(false)
    expect(is.boolean(1)).to.eql(false)
    expect(is.boolean(-1)).to.eql(false)
    expect(is.boolean(true)).to.eql(true)
    expect(is.boolean(false)).to.eql(true)
    expect(is.boolean('true')).to.eql(false)
  })

  it('object', function () {
    expect(is.object(function () {})).to.eql(false)
    expect(is.object('object')).to.eql(false)
    expect(is.object(new Date())).to.eql(false)
    expect(is.object([])).to.eql(false)
    expect(is.object({})).to.eql(true)
  })

  it('date', function () {
    expect(is.date(0)).to.eql(false)
    expect(is.date('28 July 1914')).to.eql(false)
    expect(is.date(new Date())).to.eql(true)
  })

  it('function', function () {
    expect(is.function({})).to.eql(false)
    expect(is.function(function () {})).to.eql(true)
    const fstr = 'function () {}'
    expect(is.function(fstr)).to.eql(false)
  })

  it('undefined', function () {
    expect(is.undefined(0)).to.eql(false)
    expect(is.undefined(null)).to.eql(false)
    expect(is.undefined('undefined')).to.eql(false)
    expect(is.undefined()).to.eql(true)
    expect(is.undefined(undefined)).to.eql(true)
  })

  it('error', function () {
    expect(is.error(new Error())).to.eql(true)
    expect(is.error({message: 'Error'})).to.eql(false)
    expect(is.error(false)).to.eql(false)
  })

  it('equal', function () {
    expect(is.equal(1, 1)).to.eql(true)
    expect(is.equal(false, false)).to.eql(true)
    expect(is.equal([1, 2, 3], [1, 2, 3])).to.eql(true)
    expect(is.equal({a: {b: 1}}, {a: {b: 1}})).to.eql(true)
    expect(is.equal([{a: 1}], [{a: 1}])).to.eql(true)
    expect(is.equal([{a: 1}], [{a: 2}])).to.eql(false)
    expect(is.equal({a: {b: 1}}, {a: {b: 2}})).to.eql(false)
  })

  it('.type(el)', function () {
    expect(is.type({})).to.equal('object')
    expect(is.type(1)).to.equal('number')
    expect(is.type('1')).to.equal('string')
    expect(is.type(function () {})).to.equal('function')
    expect(is.type(true)).to.equal('boolean')
    expect(is.type([])).to.equal('array')
    expect(is.type(undefined)).to.equal('undefined')
    expect(is.type(new Date())).to.equal('date')
  })
})
