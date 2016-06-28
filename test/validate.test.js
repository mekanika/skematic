/* eslint-env node, mocha */
const expect = require('chai').expect
const checkValue = require('../src/validate').checkValue
const Skematic = require('../index')

describe('Validate', function () {
  it('returns {valid, errors} object', function () {
    var record = {name: 'Jack'}
    var s = { name: {type: 'string'} }
    var res = Skematic.validate(s, record)
    expect(res).to.have.keys('valid', 'errors')
  })

  it('returns {errors:null} if no errors', function () {
    var s = {name: {type: 'string'}}
    var out = Skematic.validate(s.name, 'woo')
    expect(out.errors).to.equal(null)
    out = Skematic.validate(s, {name: 'woo'})
    expect(out.errors).to.equal(null)
  })

  it('provides error arrays keyed to properties', function () {
    var res = Skematic.validate({power: {type: 'integer'}}, {power: '1'})
    expect(res.errors).to.have.keys('power')
    expect(res.errors.power).to.have.length.gt(0)
  })

  it('sets .valid boolean based on validation result', function () {
    var res = Skematic.validate({power: {type: 'integer'}}, {power: '1'})
    expect(res.valid).to.be.false

    res = Skematic.validate({power: {type: 'integer'}}, {power: 1})
    expect(res.valid).to.be.true
  })

  it('validates scalars {validBool, errorArray!}', function () {
    var s = {type: 'string', rules: {maxLength: 3}}

    expect(Skematic.validate(s, '123').valid).to.equal(true)
    expect(Skematic.validate(s, '1234').valid).to.equal(false)
    expect(Skematic.validate(s, '1234').errors).to.be.an.instanceof(Array)
  })

  describe('$dynamic', function () {
    it('validates dynamic keys', function () {
      var MoreNested = {
        props: {
          schema: {
            $dynamic: {
              schema: {
                value: {default: '!', required: true}
              },
              default: {}
            }
          },
          default: {}
        }
      }

      var o = Skematic.validate(MoreNested, {props: {randCrazy: {}}})
      expect(o.valid).to.equal(false)
      expect(o.errors.props.randCrazy.value).to.have.length(1)
    })
  })

  describe('subschema', function () {
    describe('string reference', function () {
      it('accessor can return working schema', function () {
        var hero = {name: {type: 'string'}, power: {type: 'integer'}}
        var s = {group: {type: 'array', schema: hero}}
        var res = Skematic.validate(s, {group: [{name: 'gir', power: '3'}]})
        expect(res.valid).to.be.false
        expect(res.errors.group[0].power).to.have.length(1)
      })
    })

    describe('objects', function () {
      it('can validate complex subschema', function () {
        var s = { bigsub: {schema: {
          top: {type: 'integer'},
          cool: {type: 'string'}}
        }}

        var res = Skematic.validate(s, {bigsub: {top: 's'}})
        expect(res.errors).to.have.keys('bigsub')
        expect(res.errors.bigsub.top).to.have.length(1)
        expect(res.errors.bigsub.top[0]).to.match(/integer/)
      })

      it('can recursively validate', function () {
        var s = {
          name: {type: 'string'},
          address: { schema: {
            street: {schema: {
              number: {type: 'integer', required: true},
              name: {type: 'string', rules: {maxLength: 5}}
            }},
            city: {type: 'string', required: true},
            zipcode: {type: 'integer', required: true}
          }},
          tags: { type: 'array', schema: {type: 'string'} },
          books: {type: 'array', schema: {
            title: {type: 'string'},
            author: {type: 'string'}
          }}
        }

        var data = {
          name: 'zim',
          address: {
            street: {number: 4},
            city: 'mrrn',
            zipcode: 5151
          },
          tags: ['hello', '20'],
          books: [{title: 'WOT', author: 'RJ'}, {title: 'GOT', author: 555}]
        }

        // The following also ensures that source `data` is NOT mutated
        const pre = JSON.stringify(data)
        var res = Skematic.validate(s, data)
        const post = JSON.stringify(data)
        expect(pre === post).to.be.true

        expect(res.valid).to.be.false
        expect(res.errors.books['1'].author).to.have.length(1)
      })
    })

    describe('arrays', function () {
      it('index errors', function () {
        var s = {gir: {schema: {type: 'string'}}}
        var res = Skematic.validate(s, {gir: ['a', 'b', 4]})

        expect(res.valid).to.be.false
        // The 3rd element should have an error `arr['2']`
        expect(res.errors.gir).to.have.key('2')
      })

      it('detects array values without declaring type:array', function () {
        var s = {gir: {schema: {type: 'string', filters: ['toString']}}}

        var data = {gir: ['a', 'b', '4']}

        var res = Skematic.validate(s, data)
        expect(res.valid).to.be.true
        s.gir.type = 'array'
        res = Skematic.validate(s, data)
        expect(res.valid).to.be.true
      })

      it('of simple (primitive) types', function () {
        var s = {gir: {type: 'array', schema: {type: 'string', filters: ['toString']}}}
        var res = Skematic.validate(s, {gir: ['a', 'b', '4']})

        expect(res.valid).to.be.true
      })

      it('of complex objects/models', function () {
        var s = {
          gir: {schema: {
            age: {type: 'integer'},
            says: {type: 'string'}
          }}
        }

        var res = Skematic.validate(s, {gir: [{age: 2, says: 'hi'}, {age: 4, says: 1337}]})
        expect(res.valid).to.be.false
        expect(res.errors.gir['1'].says).to.have.length(1)
      })

      it('skips undefined arrays that have a schema AND a default', function () {
        var rec = {mega: 'kool'}
        var s = {jam: {type: 'array', default: ['moo'], schema: {type: 'string'}}}
        var res = Skematic.validate(s, rec)
        expect(res.valid).to.be.ok
      })
    })
  })
})

describe('checkValue(val, schema)', function () {
  it('returns an array of string errors', function () {
    expect(checkValue).to.be.an.instanceof(Function)
    expect(checkValue('abc')).to.have.length(0)
    expect(checkValue(1, {type: 'string'})).to.have.length(1)
    expect(checkValue(1, {type: 'string'})[0]).to.be.a('string')
  })

  it('returns empty array if no schema provided', function () {
    expect(checkValue('abc')).to.have.length(0)
  })

  it('then checks that required values are set', function () {
    var s = {required: true, rules: {oneOf: ['x']}}
    expect(checkValue(null, s)).to.have.length(1)
    expect(checkValue(null, s)[0]).to.match(/required/ig)

    // Now check the affirmative case
    s = {required: true, default: 'zim', rules: {oneOf: ['zim']}}
    expect(checkValue('zim', s)).to.have.length(0)
  })

  it('disallows null/undef for NOT NULL (req + notnull)', () => {
    const s = {allowNull: false}
    expect(checkValue(undefined, s)).to.have.length(2)
    expect(checkValue(null, s)).to.have.length(2)
  })

  it('allows `null` on .required with .allowNull', () => {
    const s = {allowNull: true, required: true}

    expect(checkValue(undefined, s)).to.have.length(1)
    expect(checkValue(null, s)).to.have.length(0)
  })

  it('returns unrequired undefined values', function () {
    expect(checkValue(undefined, {rules: {min: 0}})).to.have.length(0)
  })

  it('then applies specified rules', function () {
    var s = {type: 'integer', rules: {min: 5}}
    expect(checkValue(1, s)).to.have.length(1)
    expect(checkValue(1, s)).to.match(/min/ig)
  })

  it('adds error if rule is unknown/undeclared', function () {
    var s = {type: 'integer', rules: {'attack': true}}
    expect(checkValue(1, s)).to.have.length(1)
    expect(checkValue(1, s)).to.match(/unknown/ig)
  })

  it('bails out immediately if required fails', function () {
    var s = {rules: {minLength: 3}, required: true}
    var out = checkValue(undefined, s)
    expect(out).to.have.length(1)
    expect(out).to.match(/required/ig)
  })

  describe('error msgs', function () {
    it('can be set declaritively', function () {
      var s = {rules: {oneOf: ['a']}, errors: {oneOf: 'Hotdog!'}}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('can set default error message for schema', function () {
      var s = {rules: {oneOf: ['a']}, errors: {default: 'Hotdog!'}}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('can set default msg as string', function () {
      var s = {rules: {oneOf: ['a']}, errors: 'Hotdog!'}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('uses system default msg if no match', function () {
      var s = {rules: {oneOf: ['a']}, errors: {}}

      // @note This is HARDCODED to match the 'defaultError'
      expect(checkValue('b', s)).to.match(/failed/ig)
    })

    // The 'required' rule is a shorthand that previously was handled
    // separately to the 'regular' rules and didn't enable setting
    // its own custom message.
    it('enables setting custom required message', function () {
      var s = {required: true, errors: {required: 'woot!'}}
      expect(checkValue(undefined, s)).to.eql(['woot!'])
    })
  })
})

describe('sparseValidate', function () {
  it('only validates data object fields (not schema)', function () {
    var rec = {mega: 'kool'}
    var s = {mega: {type: 'string'}, cray: {required: true}}

    var res = Skematic.validate(s, {sparse: true}, rec)
    expect(res.valid).to.equal(true)
  })
})
