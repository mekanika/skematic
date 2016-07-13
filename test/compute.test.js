/* eslint-env node, mocha */
const expect = require('chai').expect
const format = require('../index').format
const computeValue = require('../src/compute').computeValue

describe('Computed value generator', function () {
  var fnLib = {
    run: function () { return 'yes' },
    next: function (arg) { return arg + ' no' }
  }

  var sc = {name: {generate: {ops: {fn: fnLib.run}}}}

  it('process a single value via .computeValue()', function () {
    expect(computeValue(sc.name, null, {})).to.equal('yes')
  })

  it('throws if method to generate is not found in fnLib', function (done) {
    try {
      computeValue({generate: {ops: [{fn: 'junk'}]}}, {})
    } catch (e) { done() }
  })

  it('executes directly passed function `{generate: fn}`', () => {
    const s = {name: {generate: () => 'hello'}}
    expect(format(s, {}).name).to.equal('hello')
  })

  it('generates a value from a named function in schema def', function () {
    var s = {name: {
      generate: {ops: [{fn: fnLib.run}]}}
    }

    expect(format(s, {}).name).to.equal('yes')
  })

  it('supports declaring a single fn in schema', function () {
    expect(format(sc, {}).name).to.equal('yes')
  })

  it('chains value as param into arrays of operator functions', function () {
    var s = {name: {
      generate: {
        ops: [{fn: fnLib.run}, {fn: fnLib.next}]
      }}
    }
    expect(format(s, {}).name).to.equal('yes no')
  })

  it('passes provided value as first argument on first op', function () {
    var s = {
      name: {generate: {ops: [fnLib.next]}},
      boo: {generate: {ops: [fnLib.next, fnLib.next]}}
    }
    var out = format(s, {name: '!?'})
    expect(out.name).to.equal('!? no')
    expect(out.boo).to.equal('!? no no')
  })

  it('resolves parameters provided as functions prior to passing', function () {
    var _get = function (p) {
      return 'hello ' + p
    }
    var s = {name: {
      generate: {ops: [{fn: fnLib.next, args: [ _get.bind(this, 'world') ]}]}}
    }

    var res = format(s, {})

    expect(res.name).to.equal('hello world no')
  })

  it('runs raw function ops', function () {
    var woo = function () { return 'woo!' }
    var s = {jam: {generate: {ops: [woo]}}}

    var out = format(s, {})
    expect(out.jam).to.equal('woo!')
  })

  it('run once:true only when runOnce flag is provided', function () {
    var s = {name: {generate: {ops: [{fn: fnLib.run}], once: true}}}

    var out = format(s, {})
    expect(out.name).to.equal(undefined)

    out = format(s, {}, {once: true})
    expect(out.name).to.equal('yes')
  })

  describe('Flags', function () {
    var make = function (x) { return 'swee!' + (x || '') }
    var swee = function () { return 'swee!' }

    it('default is generate all', function () {
      var s = {
        moo: {generate: {ops: [make]}}
      }

      var out = format(s, {})
      expect(out.moo).to.equal('swee!')
    })

    it('preserve:true keeps provided values', function () {
      var s = {
        moo: {generate: {ops: [make], preserve: true}}
      }
      var out = format(s, {moo: 'moo!'})
      expect(out.moo).to.equal('moo!')
    })

    it('require:true', function () {
      var s = {
        moo: {generate: {ops: [swee], require: true}},
        yep: {generate: {ops: [make], require: true, preserve: true}},
        woo: {generate: {ops: [make], require: true}}
      }

      var out = format(s, {moo: '!?', yep: 'woo!'})

      expect(out.moo).to.equal('swee!')
      expect(out.yep).to.equal('woo!')
      expect(Object.keys(out)).to.have.length(2)
    })
  })
})
