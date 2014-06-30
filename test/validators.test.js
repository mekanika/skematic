/**
 * Test dependencies
 */

var expect = require('chai').expect
  , V = require('../src/validators');

describe('Validators', function() {

  describe('.required(val)', function() {
    it('passes with any value that is defined', function() {
      expect( V.required( 'bah' ) ).to.be.true;
      expect( V.required( 0 ) ).to.be.true;
      expect( V.required( 1 ) ).to.be.true;
      expect( V.required( false ) ).to.be.true;
      expect( V.required( /regex/ ) ).to.be.true;
    });

    it('fails if passed null, undefined, ""', function () {
      expect( V.required( "" ) ).to.be.false;
      expect( V.required( null ) ).to.be.false;
      expect( V.required( undefined ) ).to.be.false;
    });

  });



  // --- Strings
  describe('Strings', function() {

    describe('.minLength( v, len )', function() {
      it('passes if string length is at least `len`', function() {
        expect( V.minLength( '123', 3) ).to.be.true;
        expect( V.minLength( '12345', 3) ).to.be.true;
      });

      it('fails if string length is less than `len`', function() {
        expect( V.minLength( '12', 3) ).to.be.false;
      });
    });


    describe('.maxLength( v, len )', function() {
      it('passes if string length is at most `len`', function() {
        expect( V.maxLength( '12345', 5) ).to.be.true;
        expect( V.maxLength( '123', 5) ).to.be.true;
      });

      it('fails if string length is more than `len`', function() {
        expect( V.maxLength( '123456', 5) ).to.be.false;
      });
    });


    describe('.betweenLength( v, min, max )', function() {
      it('passes if string length is between min and max', function() {
        expect( V.betweenLength( '12345', 5, 6) ).to.be.true;
      });

      it('fails if string length is not between min and max', function() {
        expect( V.maxLength( '123456', 1, 5) ).to.be.false;
      });
    });

  });



  // --- Numbers
  describe('Numbers', function() {

    describe('.max( v, limit )', function() {
      it('passes if number is at or below `limit`', function() {
        expect( V.max( 25, 50) ).to.be.true;
        expect( V.max( 25, 25) ).to.be.true;
      });

      it('fails if number is larger than `limit`', function() {
        expect( V.max( 10, 5) ).to.be.false;
      });
    });


    describe('.min( v, limit )', function() {
      it('passes if number is at or above `limit`', function() {
        expect( V.min( 25, 10) ).to.be.true;
        expect( V.min( 25, 25) ).to.be.true;
      });

      it('fails if number is less than `limit`', function() {
        expect( V.min( 10, 50) ).to.be.false;
      });
    });

    describe('.between( v, min, max )', function() {
      it('passes if number is between min and max', function() {
        expect( V.between( 25, 10, 50) ).to.be.true;
        expect( V.between( 25, 25, 30) ).to.be.true;
      });

      it('fails if number is not between min and max', function() {
        expect( V.between( 10, 50, 55) ).to.be.false;
      });
    });

  });



  // --- Formats
  describe('Formats', function() {

    describe('isEmail( str )', function() {

      it('passes if str is an email', function() {
        expect( V.isEmail( 'block.911@gmail.com') ).to.be.true;
        expect( V.isEmail( '01234@woo.co.uk') ).to.be.true;
      });

      it('fails if str is not an email', function() {
        expect( V.isEmail( 'he@llo@gmail.m' ) ).to.be.false;
        expect( V.isEmail( 'hello@gmail' ) ).to.be.false;
      });

    });


    describe('isUrl( str )', function() {

      it('passes if str is a URL', function() {
        expect( V.isUrl( 'www.cartoonnetwork.com') ).to.be.true;
        expect( V.isUrl( 'woo.co.uk') ).to.be.true;
        expect( V.isUrl( 'wwp.10.co') ).to.be.true;
      });

      it('fails if str is not a URL', function() {
        expect( V.isUrl( 'www.google@com' ) ).to.be.false;
        expect( V.isUrl( 'abc.' ) ).to.be.false;
        expect( V.isUrl( '1234.1111.44' ) ).to.be.false;
      });

    });

  });



  // --- Regex
  describe('Regex', function() {

    describe('is( str, exp, flags )', function() {

      it('aliases as .regex()', function() {
        expect( V.is ).to.equal( V.regex );
      });

      it('converts non regex `exp` to RegExp and applies `flags`', function(){
        expect( V.is( 'hello', 'Ello', 'i' ) ).to.be.true;
      });

      it('passes if str matches regex', function() {
        expect( V.is( 'smash', /.*Ash$/i ) ).to.be.true;
      });

      it('fails if str does not match regex', function() {
        expect( V.is( 'smash', /.*Ash$/ ) ).to.be.false;
      });

    });


    describe('not( str, exp, flags )', function() {

      it('aliases as .notRegex()', function() {
        expect( V.not ).to.equal( V.notRegex );
      });

      it('converts non regex `exp` to RegExp and applies `flags`', function(){
        expect( V.not( 'hello', 'Ello', 'i' ) ).to.be.false;
      });

      it('passes if str DOES NOT match regex', function() {
        expect( V.not( 'smash', /.*Ash$/i ) ).to.be.false;
      });

      it('fails if str DOES match regex', function() {
        expect( V.not( 'smash', /.*Ash$/ ) ).to.be.true;
      });

    });

  });

});
