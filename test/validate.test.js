/* eslint-env node, mocha */
const expect = require('chai').expect
const checkValue = require('../src/validate').checkValue
const Skematic = require('../index')
const validate = Skematic.validate

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
    expect(res.valid).to.equal(false)

    res = Skematic.validate({power: {type: 'integer'}}, {power: 1})
    expect(res.valid).to.equal(true)
  })

  it('treats `allowNull: false` as required field', () => {
    const s = {name: {allowNull: false}}
    expect(validate(s, {name: undefined}).valid).to.equal(false)
  })

  it('validates scalars {validBool, errorArray!}', function () {
    var s = {type: 'string', rules: {maxLength: 3}}

    expect(Skematic.validate(s, '123').valid).to.equal(true)
    expect(Skematic.validate(s, '1234').valid).to.equal(false)
    expect(Skematic.validate(s, '1234').errors).to.be.an.instanceof(Array)
  })

  describe('Custom rules', () => {
    it('are declared by providing a rule key a function ()', () => {
      const s = {name: {rules: {wooCheck: (val) => {
        return val === 'woo'
      }}}}

      expect(validate(s, {name: 'zim'}).valid).to.equal(false)
      expect(validate(s, {name: 'zim'}).errors.name).to.match(/wooCheck/)
      expect(validate(s, {name: 'woo'}).valid).to.equal(true)
    })

    it('can access parent data via this.<key>', () => {
      const s = {name: {rules: {woo10: function (val) {
        return this.age >= 10 && val === 'woo'
      }}}}

      expect(validate(s, {name: 'woo'}).valid).to.equal(false)
      expect(validate(s, {name: 'woo', age: 5}).valid).to.equal(false)
      expect(validate(s, {name: 'woo', age: 10}).valid).to.equal(true)
    })

    it('runs custom rules even when no value is set for field', () => {
      let flag = false
      const s = {
        name: {
          rules: { shouldExist: function (val) {
            if (!val) flag = true
            return !!val
          }}
        }
      }
      const out = validate(s, { }, { strict: true })
      console.log(out)
      expect(out.valid).to.equal(false)
      expect(flag).to.equal(true)
    })
  })

  describe('submodel', function () {
    describe('string reference', function () {
      it('accessor can return working model', function () {
        var hero = {name: {type: 'string'}, power: {type: 'integer'}}
        var s = {group: {type: 'array', model: hero}}
        var res = Skematic.validate(s, {group: [{name: 'gir', power: '3'}]})
        expect(res.valid).to.equal(false)
        expect(res.errors.group[0].power).to.have.length(1)
      })
    })

    describe('objects', function () {
      it('can validate complex submodel', function () {
        var s = { bigsub: {model: {
          top: {type: 'integer'},
          cool: {type: 'string'}}
        }}

        var res = Skematic.validate(s, {bigsub: {top: 's'}})
        expect(res.errors).to.have.keys('bigsub')
        expect(res.errors.bigsub.top).to.have.length(1)
        expect(res.errors.bigsub.top[0]).to.match(/integer/)
      })

      // Force passing of validation paramaters to sub-models
      it('enforces strict key checks on submodels', () => {
        var m = { hop: { model: { name: { required: true } } } }
        // Load in an invalid key 'derp'
        var data = { hop: { name: 'moo', derp: '😜' } }
        const res = Skematic.validate(m, data, { strict: true })
        expect(res.valid).to.equal(false)
        expect(res.errors.derp[0]).to.match(/invalidkey/i)
      })

      it('can recursively validate', function () {
        var s = {
          name: {type: 'string'},
          address: { model: {
            street: {model: {
              number: {type: 'integer', required: true},
              name: {type: 'string', rules: {maxLength: 5}}
            }},
            city: {type: 'string', required: true},
            zipcode: {type: 'integer', required: true}
          }},
          tags: { type: 'array', model: {type: 'string'} },
          books: {type: 'array',
            model: {
              title: {type: 'string'},
              author: {type: 'string'}
            }
          }
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
        expect(pre === post).to.equal(true)

        expect(res.valid).to.equal(false)
        expect(res.errors.books['1'].author).to.have.length(1)
      })
    })

    describe('arrays', function () {
      it('index errors', function () {
        var s = {gir: {model: {type: 'string'}}}
        var res = Skematic.validate(s, {gir: ['a', 'b', 4]})

        expect(res.valid).to.equal(false)
        // The 3rd element should have an error `arr['2']`
        expect(res.errors.gir).to.have.key('2')
      })

      it('detects array values without declaring type:array', function () {
        var s = {gir: {model: {type: 'string', filters: ['toString']}}}

        var data = {gir: ['a', 'b', '4']}

        var res = Skematic.validate(s, data)
        expect(res.valid).to.equal(true)
        s.gir.type = 'array'
        res = Skematic.validate(s, data)
        expect(res.valid).to.equal(true)
      })

      it('of simple (primitive) types', function () {
        var s = {gir: {type: 'array', model: {type: 'string', filters: ['toString']}}}
        var res = Skematic.validate(s, {gir: ['a', 'b', '4']})

        expect(res.valid).to.equal(true)
      })

      it('of complex objects/models', function () {
        var s = {
          gir: {model: {
            age: {type: 'integer'},
            says: {type: 'string'}
          }}
        }

        var res = Skematic.validate(s, {gir: [{age: 2, says: 'hi'}, {age: 4, says: 1337}]})
        expect(res.valid).to.equal(false)
        expect(res.errors.gir['1'].says).to.have.length(1)
      })

      it('skips undefined arrays that have a model AND a default', function () {
        var rec = {mega: 'kool'}
        var s = {jam: {type: 'array', default: ['moo'], model: {type: 'string'}}}
        var res = Skematic.validate(s, rec)
        expect(res.valid).to.equal(true)
      })
    })
  })

  describe('{keyCheckOnly: true}', () => {
    it('only checks data keys exist on model', () => {
      const s = {name: {default: 'hi'}}
      expect(validate(s, {name: 1}, {keyCheckOnly: true}).valid).to.equal(true)
      const out = validate(s, {name: 1, x: 1}, {keyCheckOnly: true})
      expect(out.valid).to.equal(false)
    })
  })

  describe('{sparse: true} Sparse validate', function () {
    it('only validates data object fields (not model)', function () {
      var rec = {mega: 'kool'}
      var s = {mega: {type: 'string'}, cray: {required: true}}

      var res = Skematic.validate(s, rec, {sparse: true})
      expect(res.valid).to.equal(true)
    })

    it('passes parentData object for sparse `this` rule checks', () => {
      const mdl = {
        type: { default: 'email' },
        label: {
          rules: { has: function (val) {
            if (this.type === 'label') return !!val
            else return true
          }}
        }
      }
      const out = validate(mdl, { type: 'label', label: '' }, { sparse: true })
      const out2 = validate(mdl, { type: 'label' }, { sparse: true })
      expect(out.valid).to.equal(false)
      expect(out2.valid).to.equal(true)
    })
  })

  describe('{strict: true} Strict field modeling', () => {
    it('fails validation if passed unknown keys', () => {
      var s = {mega: {}, cray: {required: true}}

      const out = validate(s, {cray: '!', junk: true}, {strict: true})
      expect(out.valid).to.equal(false)
    })

    it('succeeds if all keys known (and valid)', () => {
      var s = {mega: {}, cray: {required: true}}

      const failout = validate(s, {mega: 1}, {strict: true})
      const winout = validate(s, {mega: 1, cray: 1}, {strict: true})

      expect(failout.valid).to.equal(false)
      expect(winout.valid).to.equal(true)
    })
  })
})

describe('checkValue(val, model)', function () {
  it('returns an array of string errors', function () {
    expect(checkValue).to.be.an.instanceof(Function)
    expect(checkValue('abc')).to.have.length(0)
    expect(checkValue(1, {type: 'string'})).to.have.length(1)
    expect(checkValue(1, {type: 'string'})[0]).to.be.a('string')
  })

  it('returns empty array if no model provided', function () {
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

  it('runs rules on `null` if rules are set and .allowNull', () => {
    const a = checkValue(null, { allowNull: true })
    const b = checkValue(null, { allowNull: true, rules: { minLength: 3 } })
    expect(a).to.have.length(0)
    expect(b).to.have.length(1)
  })

  it('returns unrequired undefined values', function () {
    const noRules = checkValue(undefined, { default: 'yes' })
    const withRules = checkValue(undefined, { rules: { min: 0 } })

    expect(noRules).to.have.length(0)
    expect(withRules).to.have.length(1)
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

  describe('.write scopes permissions', () => {
    it('check .scopes against .write requirements', () => {
      const s = {write: 'play'}
      const out = checkValue('Swee!', s, null, {scopes: ['fail!']})
      expect(out).to.match(/writePermissions/ig)

      const good = checkValue('Swee!', s, null, {scopes: ['play']})
      expect(good).to.have.length(0)
    })

    it('accepts strings + arrays on .write and .scopes', () => {
      const s1 = {write: 'play'}
      const s2 = {write: ['play']}

      const o1 = checkValue(null, s1, null, {scopes: 'play'})
      const o2 = checkValue(null, s1, null, {scopes: ['play']})
      const o3 = checkValue(null, s2, null, {scopes: 'play'})
      const o4 = checkValue(null, s2, null, {scopes: ['play']})

      expect(o1).to.have.length(0)
      expect(o2).to.have.length(0)
      expect(o3).to.have.length(0)
      expect(o4).to.have.length(0)
    })

    it('ignores .write settings if `unscope: true`', () => {
      const s = {write: ['boom']}
      const out = checkValue(1, s, null, {unscope: true})
      expect(out).to.have.length(0)
    })
  })

  describe('error msgs', function () {
    it('can be set declaratively', function () {
      var s = {rules: {oneOf: ['a']}, errors: {oneOf: 'Hotdog!'}}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('can set default error message for model', function () {
      var s = {rules: {oneOf: ['a']}, errors: {default: 'Hotdog!'}}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('can set default msg as string', function () {
      var s = {rules: {oneOf: ['a']}, errors: 'Hotdog!'}
      expect(checkValue('b', s)[0]).to.equal('Hotdog!')
    })

    it('uses default ruleKey msg if no match', function () {
      var s = {rules: {oneOf: ['a']}, errors: {}}
      expect(checkValue('b', s)[0]).to.eql('oneOf')
    })

    // The 'required' rule is a shorthand that previously was handled
    // separately to the 'regular' rules and didn't enable setting
    // its own custom message.
    it('enables setting custom required message', function () {
      var s = {required: true, errors: {required: 'woot!'}}
      expect(checkValue(undefined, s)).to.eql(['woot!'])
    })

    it('returns `unknownRule:...` on unknown rule declaration', () => {
      const s = {rules: {derp: true}}
      expect(checkValue(1, s)[0]).to.eql('unknownRule:derp')
    })

    it('returns `required` on missing required field', () => {
      const s = {required: true}
      expect(checkValue(undefined, s)[0]).to.eql('required')
    })

    it('returns `writePermissions` incorrect scopes', () => {
      const s = {write: 'yo'}
      const opts = {scopes: ['nothinguseful']}
      expect(checkValue(1, s, null, opts)[0]).to.eql('writePermissions')
    })

    it('returns `invalidObject` on bad data keyCheck', () => {
      const vdat = validate({}, undefined, {keyCheckOnly: true})
      expect(vdat.errors.data[0]).to.eql('invalidObject')
    })

    it('returns `invalidKey` on bad key on keyCheck', () => {
      const s = {moo: {}}
      const vdat = validate(s, {swee: 1}, {keyCheckOnly: true})
      expect(vdat.errors.swee[0]).to.eql('invalidKey')
    })
  })
})
