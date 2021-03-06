/* eslint-env node, mocha */
const expect = require('chai').expect
const format = require('../src/format')

describe('Transform', () => {
  it('applies .transform method to value', () => {
    const m = {name: {transform: v => v + ''}}
    const out = format(m, {name: 123})

    expect(out.name).to.equal('123')
  })

  it('transforms sub-model driven arrays', () => {
    const m = {
      demo: {
        model: { hi: {} },
        transform: v => JSON.stringify(v) + 'moo!'
      }
    }
    const out = format(m, { demo: [{hi: 1, x: 1}] }, { strict: true })
    expect(out.demo).to.equal('[{"hi":1}]moo!')
  })

  it('can access values on `this`', () => {
    const m = {
      name: {},
      power: {
        transform: function (v) {
          if (this.name === 'Gandalf') return 'magic'
          else return v
        }
      }
    }
    const out = format(m, { name: 'Gandalf', power: 'beard' })
    expect(out.power).to.equal('magic')
  })

  it('throws an error if .transform is not a function', () => {
    const m = {name: {transform: 'yes'}}
    const match = 'Expect .transform value to be a function()'
    let caught = false
    try {
      format(m, {name: 'Zim'})
    } catch (err) {
      expect(err.message).to.equal(match)
      caught = true
    }

    expect(caught).to.equal(true)
  })
})
