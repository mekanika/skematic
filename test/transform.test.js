/* eslint-env node, mocha */
const expect = require('chai').expect
const format = require('../src/format')

describe('Transform', () => {
  it('applies .transform method to value', () => {
    const m = {name: {transform: v => v + ''}}
    const out = format(m, {name: 123})

    expect(out.name).to.equal('123')
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
