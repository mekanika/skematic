/* eslint-env node, mocha */
const expect = require('chai').expect
const Skematic = require('../index')
const format = require('../src/format')

const gen = {
  xx: function () { return 'wow' },
  dbl: function (x) { return x * 2 }
}

describe('.format(skm, opts, data)', function () {
  it('supports passing 2 args (model, data)', function () {
    var s = {name: {default: 'ace'}, power: {default: 3}}
    var out = format(s, {})
    expect(out.name).to.equal('ace')
    expect(out.power).to.equal(3)
  })

  it('can format scalar values', function () {
    var s = {default: 'smoo'}

    var out = format(s, '')
    expect(out).to.equal('smoo')
  })

  it('`sparse` opt defaults to false', function () {
    var s = {name: {default: 'ace'}, power: {default: 3}}
    var out = format(s, {})
    expect(out.name).to.equal('ace')
    expect(out.power).to.equal(3)
  })

  it('`sparse` opt "true" only parses provided data', function () {
    var s = {name: {default: 'ace'}, power: {default: 3}}
    var out = format(s, {power: undefined}, {sparse: true})
    expect(out.power).to.equal(3)
    expect(out).to.have.keys('power')
  })

  it('`defaults` opt default sets the default values :O', function () {
    var s = {name: {default: 'ace'}}
    var out = format(s, {}, {})
    expect(out.name).to.equal('ace')
  })

  it('applies falsey defaults', function () {
    expect(format({field: {default: false}}, {field: undefined}).field).to.equal(false)
  })

  it('`transform` opt default transforms values', function () {
    var s = {name: {default: 'ace', transform: v => v.toUpperCase()}}
    var out = format(s, {}, {})
    expect(out.name).to.equal('ACE')
  })

  it('`transform` opt "false" does not apply transforms', function () {
    var s = {name: {default: 'ace', transform: v => v.toUpperCase()}}
    var out = format(s, {}, {transform: false})
    expect(out.name).to.equal('ace')
  })

  it('`generate` opt default computes generator values', function () {
    var s = {
      name: {
        generate: {
          ops: [{fn: gen.xx}]
        }
      }
    }

    var out = format(s, {}, {})
    expect(out.name).to.equal('wow')
  })

  it('`generate` opt can run "once" flags for computed', function () {
    var s = {
      name: {
        generate: {
          ops: [{fn: gen.xx}],
          // NOTE THIS: we're setting name to only generate with "once" flag
          once: true
        }
      }
    }

    var out = format(s, {})
    expect(out).to.not.have.key('name')

    out = format(s, {}, {once: true})
    expect(out.name).to.equal('wow')
  })

  it('`generate` opt "false" does not run generators', function () {
    var s = {
      name: {
        generate: { ops: [{fn: gen.xx}] }
      }
    }

    var out = format(s, {}, {generate: false})
    expect(out).to.not.have.key('name')
  })

  it('`lock` model flag removes user provided data fields', () => {
    const s = {name: {lock: true}}
    const data = format(s, {name: 'moo'})
    expect(Object.keys(data).length).to.equal(0)

    // Ensure user provided data gets stripped and regenerated
    const y = {createdAt: {
      generate: {ops: () => 'swee', once: true},
      lock: true
    }}
    const zz = format(y, {createdAt: 'moo'}, {once: true})
    expect(zz.createdAt).to.not.equal('moo')
    expect(zz.createdAt).to.equal('swee')
  })

  it('`unlock:true` format option disables model flag', () => {
    const s = {name: {lock: true}}
    const dataLocked = format(s, {name: 'moo'}, {unlock: false})
    expect(dataLocked.name).to.equal(undefined)
    const dataUnlocked = format(s, {name: 'moo'}, {unlock: true})
    expect(Object.keys(dataUnlocked).length).to.equal(1)
  })

  it('`strip` removes matching field values', function () {
    var data = {a: undefined, b: null, c: 2, d: ':)'}
    var s = {a: {type: 'number'}}
    var out = format(s, data, {strip: [undefined, null, ':)']})
    expect(out).to.eql({c: 2})
  })

  it('`mapIdFrom` maps the primaryKey from the id field', function () {
    var propSchema = {
      prop_id: {primaryKey: true},
      name: {type: 'string'}
    }

    var data = [ {_id: '512314', name: 'power'}, {_id: '519910', name: 'speed'} ]

    var out = Skematic.format(propSchema, data, {mapIdFrom: '_id'})
    expect(out).to.have.length(2)
    expect(out[0]).to.include.key('prop_id')
    expect(out[0]).to.not.include.key('_id')
  })

  it('`strict` strips fields not declared on model', function () {
    var scm = {
      name: {type: 'string'},
      tags: {type: 'array', model: {label: {}}}
    }
    var data = {woot: '1', name: 'yo', tags: [{whatever: 1, label: 'moo'}]}

    var out = Skematic.format(scm, data, {strict: true})
    expect(out).to.have.keys('name', 'tags')
    expect(out.tags[0]).to.have.key('label')
  })

  describe('`show` scopes projector', () => {
    it('hides fields string:string', () => {
      const s = {name: {show: 'admin'}, age: {default: 21}}
      const hasScope = format(s, {name: 'X'}, {scopes: 'admin'})
      const notScope = format(s, {name: 'X'}, {})

      expect(hasScope.name).to.equal('X')
      expect(notScope).to.have.keys('age')
    })

    it('hides fileds string:array', () => {
      const s = {name: {show: ['admin']}, age: {default: 21}}
      const hasScope = format(s, {name: 'X'}, {scopes: 'admin'})
      const notScope = format(s, {name: 'X'}, {})

      expect(hasScope.name).to.equal('X')
      expect(notScope).to.have.keys('age')
    })

    it('hides fileds array:array', () => {
      const s = {name: {show: ['anything', 'admin']}, age: {default: 21}}
      const hasScope = format(s, {name: 'X'}, {scopes: ['admin']})
      const notScope = format(s, {name: 'X'}, {})

      expect(hasScope.name).to.equal('X')
      expect(notScope).to.have.keys('age')
    })

    it('hides fileds array:string', () => {
      const s = {name: {show: 'admin'}, age: {default: 21}}
      const hasScope = format(s, {name: 'X'}, {scopes: ['admin', 'any']})
      const notScope = format(s, {name: 'X'}, {})

      expect(hasScope.name).to.equal('X')
      expect(notScope).to.have.keys('age')
    })

    it('`unscope` disables `show` scopes', () => {
      const s = {name: {show: 'admin'}, age: {default: 21}}
      const noscope = format(s, {name: 'X'})
      const unscope = format(s, {name: 'X'}, {unscope: true})

      expect(noscope).to.have.keys('age')
      expect(unscope).to.have.keys('name', 'age')
    })
  })

  describe('sub-model', function () {
    it('applies format to embedded model objects', function () {
      var s = {
        face: {default: 'smoo'},
        person: {
          model: {
            name: {default: 'Zim'},
            age: {generate: {ops: [{fn: gen.dbl, args: [5]}]}},
            phrase: {transform: v => v.toUpperCase()}
          },
          // If no default specified, 'person' will only be applied
          // when a {person:{..}} field is provided
          default: {}
        }
      }

      var out = format(s, {})
      expect(out.person.name).to.equal('Zim')
      expect(out.person.age).to.equal(10)

      out = format(s, {person: {phrase: 'woo'}})
      expect(out.person.phrase).to.equal('WOO')
    })
  })

  describe('arrays', function () {
    it('can array', function () {
      var s = {
        field: {
          type: 'array',
          model: {
            default: 'moo',
            generate: {ops: [{fn: gen.xx}]},
            transform: v => v.toUpperCase()
          },
          default: []
        }
      }

      var out = format(s, {field: [undefined, 'hi']})
      expect(out.field).to.have.length(2)
      expect(out.field[0]).to.equal('WOW')

      out = format(s, undefined)
      expect(out.field).to.eql([])
    })

    it('support object field values as arrays', function () {
      var s = {
        zeep: {
          type: 'array',
          model: {
            default: 'moo',
            generate: {ops: [{fn: gen.xx}]},
            transform: v => v.toUpperCase()
          },
          default: []
        },
        moo: {default: []}
      }

      var out = format(s, {zeep: [undefined], moo: [undefined]})
      expect(out.zeep[0]).to.equal('WOW')
      expect(out.moo).to.eql([undefined])

      out = format(s, {zeep: undefined})
      expect(out.zeep).to.eql([])
      expect(out.moo).to.eql([])
    })

    it('applies model to objects in arrays', function () {
      var demo = {
        field: {
          type: 'array',
          model: {
            boom: {default: '!', required: true}
          }
        }
      }
      var out = format(demo, {field: [{}]})
      expect(out.field[0].boom).to.equal('!')
    })
  })
})
