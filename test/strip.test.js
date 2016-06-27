/* eslint-env node, mocha */
const expect = require('chai').expect
const strip = require('../src/strip')

describe('.strip()', function () {
  it('removes fields whose values match', function () {
    var data = {a: undefined, b: 2}
    strip(undefined, data)
    expect(data).to.eql({b: 2})
  })

  it('allows passing arrays of `values`', function () {
    var data = {a: undefined, b: null, c: 2, d: ':)'}
    strip([undefined, null, ':)'], data)
    expect(data).to.eql({c: 2})
  })
})
