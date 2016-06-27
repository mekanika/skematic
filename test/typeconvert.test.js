/* eslint-env node, mocha */
/**
 * Dependencies
 */

const expect = require('chai').expect
const Cast = require('../src/typeconvert')

describe('Cast Types', function () {
  it('functions are named', function () {
    expect(Cast.toString.name).to.equal('toString')
    expect(Cast.toNumber.name).to.equal('toNumber')
    expect(Cast.toInteger.name).to.equal('toInteger')
    expect(Cast.toFloat.name).to.equal('toFloat')
    expect(Cast.toBoolean.name).to.equal('toBoolean')
    expect(Cast.toDate.name).to.equal('toDate')
  })

  describe('.toString( val )', function () {
    it('casts value to a string', function () {
      expect(typeof Cast.toString('1234')).to.equal('string')
      expect(typeof Cast.toString(1234)).to.equal('string')
      expect(typeof Cast.toString(true)).to.equal('string')
      expect(typeof Cast.toString(new Date())).to.equal('string')
      expect(typeof Cast.toString(function () {})).to.equal('string')
      expect(typeof Cast.toString({})).to.equal('string')
      expect(typeof Cast.toString([])).to.equal('string')
    })

    it('casts objects as JSON', function () {
      expect(Cast.toString({a: 1, b: {c: 2}})).to.equal('{"a":1,"b":{"c":2}}')
    })

    it('returns null if value is null', function () {
      expect(Cast.toString(null)).to.equal(null)
    })

    it('throws if it given `undefined`', function () {
      var err
      try {
        Cast.toString(undefined)
      } catch (e) { err = e }
      expect(err).to.be.an.instanceof(Error)
      expect(err.message).to.match(/failed.*cast/i)
    })
  })

  // Base number conversion utility
  describe('.convertNumber( val, conv, radix )', function () {
    it('default radix is 10', function () {
      expect(Cast.convertNumber('100')).to.equal(100)
    })

    it('applies a radix base using parseInt if radix supplied', function () {
      expect(Cast.convertNumber('12.15', null, 8)).to.equal(10)
      expect(Cast.convertNumber(15.15, null, 8)).to.equal(13)
      expect(Cast.convertNumber('12.15', null, 10)).to.equal(12)
    })

    it('throws if it cannot convert', function () {
      var err
      try {
        Cast.convertNumber({})
      } catch (e) { err = e }
      expect(err).to.be.an.instanceof(Error)
    })

    it('empty string returns undefined', function () {
      expect(Cast.convertNumber('')).to.equal(undefined)
    })

    describe('.toNumber( val )', function () {
      it('casts value to a number', function () {
        expect(typeof Cast.toNumber('1234')).to.equal('number')
        expect(typeof Cast.toNumber(1234)).to.equal('number')
        expect(typeof Cast.toNumber(true)).to.equal('number')
      })

      it('casts boolean values to 1 or 0', function () {
        expect(Cast.toNumber(true)).to.equal(1)
        expect(Cast.toNumber(false)).to.equal(0)
      })

      it('returns null if value is null', function () {
        expect(Cast.toNumber(null)).to.equal(null)
      })

      it('throws if it cannot convert', function () {
        var err
        try {
          Cast.toNumber({})
        } catch (e) { err = e }
        expect(err).to.be.an.instanceof(Error)
      })
    })

    describe('.toInteger( val, radix )', function () {
      it('delegates .toNumber with parseInt as convertor', function () {
        expect(Cast.toInteger('44.23')).to.equal(44)
      })

      it('passes a radix if provided', function () {
        expect(Cast.toInteger('011', 8)).to.equal(9)
      })
    })

    describe('.toFloat( val )', function () {
      it('delegates .toNumber with parseFloat as convertor', function () {
        expect(Cast.toFloat('0.0314E+2')).to.equal(3.14)
      })
    })
  })

  describe('.toBoolean( val )', function () {
    it('casts value (everything) to a boolean', function () {
      expect(typeof Cast.toBoolean('0')).to.equal('boolean')
      expect(typeof Cast.toBoolean(1234)).to.equal('boolean')
      expect(typeof Cast.toBoolean(true)).to.equal('boolean')
      expect(typeof Cast.toBoolean(new Date())).to.equal('boolean')
      expect(typeof Cast.toBoolean(function () {})).to.equal('boolean')
      expect(typeof Cast.toBoolean({})).to.equal('boolean')
      expect(typeof Cast.toBoolean([])).to.equal('boolean')
    })

    it('converts string "0" and "1" appropriately', function () {
      expect(Cast.toBoolean('0')).to.equal(false)
      expect(Cast.toBoolean('1')).to.true
    })

    it('converts string "true" and "false" appropriately', function () {
      expect(Cast.toBoolean('false')).to.equal(false)
      expect(Cast.toBoolean('true')).to.true
    })

    it('returns null if value is null', function () {
      expect(Cast.toBoolean(null)).to.equal(null)
    })
  })

  describe('.toDate( val )', function () {
    it('casts value to a Date', function () {
      expect(Cast.toDate('1234')).to.be.an.instanceof(Date)
      expect(Cast.toDate(1234)).to.be.an.instanceof(Date)
      expect(Cast.toDate(new Date())).to.be.an.instanceof(Date)
      expect(Cast.toDate(['1'])).to.be.an.instanceof(Date)
    })

    it('returns null if value is null or ""', function () {
      expect(Cast.toDate(null)).to.equal(null)
      expect(Cast.toDate('')).to.equal(null)
    })
  })
})
