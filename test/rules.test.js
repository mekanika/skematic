/* eslint-env node, mocha */
/**
 * Test dependencies
 */

const expect = require('chai').expect
const V = require('../src/rules')

describe('Rules', function () {
  describe('.required(val)', function () {
    it('passes with any value that is defined', function () {
      expect(V.required('bah')).to.be.true
      expect(V.required(0)).to.be.true
      expect(V.required(1)).to.be.true
      expect(V.required(false)).to.be.true
      expect(V.required(/regex/)).to.be.true
    })

    it('fails if passed null, undefined', function () {
      expect(V.required('')).to.be.true
      expect(V.required(null)).to.be.false
      expect(V.required(undefined)).to.be.false
    })
  })

  describe('.isEmpty(v)', function () {
    it('passes if value is empty', function () {
      expect(V.isEmpty('')).to.be.true
    })

    it('fails if value is NOT empty', function () {
      expect(V.isEmpty('123')).to.be.false
      expect(V.isEmpty('123')).to.be.false
      expect(V.isEmpty(null)).to.be.false
    })
  })

  describe('.notEmpty(v)', function () {
    it('passes if value is NOT empty', function () {
      expect(V.notEmpty('whatever')).to.be.true
      expect(V.notEmpty(null)).to.be.true
      expect(V.notEmpty(false)).to.be.true
    })

    it('fails if value is empty', function () {
      expect(V.notEmpty('')).to.be.false
      expect(V.notEmpty()).to.be.false
    })
  })

  describe('eq(val, match)', function () {
    it('matches strictly equal', function () {
      expect(V.eq('hi', 'hi')).to.be.true
    })

    it('fails on mismatch', function () {
      expect(V.eq(1, '1')).to.be.false
    })
  })

  describe('neq(val, notmatch)', function () {
    it('fails on equality', function () {
      expect(V.neq('hi', 'hi')).to.be.false
    })

    it('passes on mismatch', function () {
      expect(V.neq(1, '1')).to.be.true
    })
  })

  // --- Strings
  describe('Strings', function () {
    describe('.minLength( v, len )', function () {
      it('passes if string length is at least `len`', function () {
        expect(V.minLength('123', 3)).to.be.true
        expect(V.minLength('12345', 3)).to.be.true
      })

      it('fails if string length is less than `len`', function () {
        expect(V.minLength('12', 3)).to.be.false
      })
    })

    describe('.maxLength( v, len )', function () {
      it('passes if string length is at most `len`', function () {
        expect(V.maxLength('12345', 5)).to.be.true
        expect(V.maxLength('123', 5)).to.be.true
      })

      it('fails if string length is more than `len`', function () {
        expect(V.maxLength('123456', 5)).to.be.false
      })
    })
  })

  // --- Numbers
  describe('Numbers', function () {
    describe('.max( v, limit )', function () {
      it('passes if number is at or below `limit`', function () {
        expect(V.max(25, 50)).to.be.true
        expect(V.max(25, 25)).to.be.true
      })

      it('fails if number is larger than `limit`', function () {
        expect(V.max(10, 5)).to.be.false
      })
    })

    describe('.min( v, limit )', function () {
      it('passes if number is at or above `limit`', function () {
        expect(V.min(25, 10)).to.be.true
        expect(V.min(25, 25)).to.be.true
      })

      it('fails if number is less than `limit`', function () {
        expect(V.min(10, 50)).to.be.false
      })
    })
  })

  // --- Lists
  describe('Lists', function () {
    describe('.oneOf(v,list)', function () {
      it('passes if value is in declared list', function () {
        expect(V.oneOf('hi', ['yo', 'hi', 'sup'])).to.be.true
      })

      it('fails if value not oneOf in list', function () {
        expect(V.oneOf('bye', ['yo', 'hi', 'sup'])).to.be.false
      })
    })

    describe('.notOneOf(v,list)', function () {
      it('passes if value is NOT in declared list', function () {
        expect(V.notOneOf('bye', ['yo', 'hi', 'sup'])).to.be.true
      })

      it('fails if value IS present in list', function () {
        expect(V.notOneOf('hi', ['yo', 'hi', 'sup'])).to.be.false
      })
    })

    describe('.has(list, val)', function () {
      it('passes if list contains val', function () {
        expect(V.has([1, 2, 3], 2)).to.be.true
        expect(V.has(['one', 'two', 'woo'], 'woo')).to.be.true
      })

      it('fails if list does not contain val', function () {
        expect(V.has([1, 2, 3], 5)).to.be.false
        expect(V.has(['one', 'two', 'woo']), 3).to.be.false
      })
    })

    describe('.hasNot(list, val)', function () {
      it('passes if list DOES NOT contain val', function () {
        expect(V.hasNot([1, 2, 3], 5)).to.be.true
        expect(V.hasNot(['one', 'two', 'woo'], 'BOO')).to.be.true
      })

      it('fails if list DOES contain val', function () {
        expect(V.hasNot([1, 2, 3], 2)).to.be.false
        expect(V.hasNot(['one', 'two', 'woo'], 'woo')).to.be.false
      })
    })
  })

  // --- Formats
  describe('Formats', function () {
    describe('isEmail( str )', function () {
      it('passes if str is an email', function () {
        expect(V.isEmail('block.911@gmail.com')).to.be.true
        expect(V.isEmail('01234@woo.co.uk')).to.be.true
      })

      it('fails if str is not an email', function () {
        expect(V.isEmail('he@llo@gmail.m')).to.be.false
        expect(V.isEmail('hello@gmail')).to.be.false
      })
    })

    describe('isUrl( str )', function () {
      it('passes if str is a URL', function () {
        expect(V.isUrl('www.cartoonnetwork.com')).to.be.true
        expect(V.isUrl('woo.co.uk')).to.be.true
        expect(V.isUrl('wwp.10.co')).to.be.true
      })

      it('fails if str is not a URL', function () {
        expect(V.isUrl('www.google@com')).to.be.false
        expect(V.isUrl('abc.')).to.be.false
        expect(V.isUrl('1234.1111.44')).to.be.false
      })
    })

    describe('isAlpha( str )', function () {
      it('passes if str is alpha characters', function () {
        expect(V.isAlpha('abcDEF')).to.be.true
      })

      it('fails if str is not alpha characters', function () {
        expect(V.isAlpha('123abc')).to.be.false
        expect(V.isAlpha('_abc')).to.be.false
        expect(V.isAlpha(',./abc')).to.be.false
      })
    })

    describe('isAlphaNum( str )', function () {
      it('passes if str is alphaNumeric characters', function () {
        expect(V.isAlphaNum('123abc')).to.be.true
      })

      it('fails if str is not alphaNumeric characters', function () {
        // expect( V.isAlpha('123abc') ).to.be.false
        expect(V.isAlphaNum('_abc')).to.be.false
        expect(V.isAlphaNum(',./abc')).to.be.false
      })
    })

    describe('isNumber( val )', () => {
      it('passes if val is a number', () => {
        expect(V.isNumber(123)).to.be.true
        expect(V.isNumber(99.123)).to.be.true
        expect(V.isNumber(1 / 3)).to.be.true
      })

      it('fails if val is not a number', () => {
        expect(V.isNumber(NaN)).to.be.false
        expect(V.isNumber(true)).to.be.false
        expect(V.isNumber('123')).to.be.false
      })
    })

    describe('isString( val )', () => {
      it('passes if val is a string', () => {
        expect(V.isString('123')).to.be.true
        expect(V.isString('!@#!@$!@$')).to.be.true
        expect(V.isString(1 / 3 + '')).to.be.true
      })

      it('fails if val is not a string', () => {
        expect(V.isString(NaN)).to.be.false
        expect(V.isString(true)).to.be.false
        expect(V.isString(123)).to.be.false
      })
    })
  })

  // --- Match
  describe('Match (Regexp)', function () {
    describe('match( str, exp, flags )', function () {
      it('converts non regex `exp` to RegExp and applies `flags`', function () {
        expect(V.match('hello', 'Ello', 'i')).to.be.true
      })

      it('passes if str matches regex', function () {
        expect(V.match('smash', /.*Ash$/i)).to.be.true
      })

      it('fails if str does not match regex', function () {
        expect(V.match('smash', /.*Ash$/)).to.be.false
      })
    })

    describe('notMatch( str, exp, flags )', function () {
      it('converts non regex `exp` to RegExp and applies `flags`', function () {
        expect(V.notMatch('hello', 'Ello', 'i')).to.be.false
      })

      it('passes if str DOES NOT match regex', function () {
        expect(V.notMatch('smash', /.*Ash$/i)).to.be.false
      })

      it('fails if str DOES match regex', function () {
        expect(V.notMatch('smash', /.*Ash$/)).to.be.true
      })
    })
  })
})
