/* eslint-env node, mocha */
const expect = require('chai').expect
const Skematic = require('../index')

describe('API', function () {
  var apiMethods = [
    'format',
    'validate'
  ]

  // This loops through all the EXPECTED methods to be exposed on the API .
  // Modify the array above `apiMethods` to add and remove from the API surface.
  apiMethods.forEach(function (method) {
    it('.' + method + '() exists', function () {
      expect(Skematic[method]).to.be.an.instanceof(Function)
    })
  })
})

describe('Skematic(model [, opts]) model loader', () => {
  it('preloads model for .format', () => {
    var s = {default: 'smoo'}
    var out = Skematic(s).format('')
    expect(out).to.equal('smoo')
  })

  it('can preload opts on model for .format', () => {
    var s = {name: {default: 'ace'}, power: {default: 3}}
    var out = Skematic(s, {sparse: true}).format({power: undefined})
    expect(out.power).to.equal(3)
    expect(out).to.have.keys('power')
  })

  it('can override preloaded opts on .format', () => {
    var s = {name: {default: 'ace'}, power: {default: 3}}
    var out = Skematic(s, {sparse: true}).format({power: undefined}, {sparse: false})
    expect(out.power).to.equal(3)
    expect(out).to.have.keys('power', 'name')
  })

  it('can preload model for .validate', () => {
    const s = { name: {type: 'string'} }
    var res = Skematic(s).validate({name: 'Jack'})
    expect(res).to.have.keys('valid', 'errors')
  })

  it('can preload opts on model for .validate', () => {
    var s = {mega: {type: 'string'}, cray: {required: true}}
    var res = Skematic(s, {sparse: true}).validate({mega: 'kool'})
    expect(res.valid).to.equal(true)
  })

  it('can override preloaded opts on .validate', () => {
    var s = {mega: {type: 'string'}, cray: {required: true}}
    var res = Skematic(s, {sparse: true}).validate({mega: 'kool'}, {sparse: false})
    expect(res.valid).to.equal(false)
  })
})

describe('createFrom .format(skm)', function () {
  var _s = {name: {default: 'Gir'}, age: {}, power: {}}

  it('builds an object to match the Skematic keys', function () {
    expect(Skematic.format(_s)).to.have.keys('name', 'age', 'power')
  })

  it('sets intial object defaults', function () {
    expect(Skematic.format(_s).name).to.equal('Gir')
  })

  it('runs .format() to execute generators', function () {
    var go = function () { return 'woo!' }
    var s = {shout: {generate: {ops: [go]}}}
    expect(Skematic.format(s)).to.eql({shout: 'woo!'})
  })

  it('initialises sub-model fields on objects', function () {
    var s = {swee: {model: {
      tags: {type: 'array', default: []},
      name: {type: 'string', default: 'user'}
    }}}

    expect(Skematic.format(s)).to.eql({swee: {tags: [], name: 'user'}})
  })

  it('intialises sub-model fields on arrays', function () {
    var s = {swee: {type: 'array', default: [{}], model: {
      name: {type: 'string', default: 'user'}
    }}}

    expect(Skematic.format(s)).to.eql({swee: [{name: 'user'}]})
  })
})
