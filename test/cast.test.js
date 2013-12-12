
/**
 * Dependencies
 */

var expect = require('expect.js')
  , AuxArray = require('../lib/array')
  , Cast = require('../lib/cast');


describe('Cast Types', function() {

  it('functions are named', function() {

    expect( Cast.toString.name ).to.be( 'toString' );
    expect( Cast.toNumber.name ).to.be( 'toNumber' );
    expect( Cast.toInteger.name ).to.be( 'toInteger' );
    expect( Cast.toFloat.name ).to.be( 'toFloat' );
    expect( Cast.toBoolean.name ).to.be( 'toBoolean' );
    expect( Cast.toDate.name ).to.be( 'toDate' );

  });


  describe('.toAuxArray( val, schema )', function() {

    it('casts value to an AuxArray', function() {
      expect( Cast.toAuxArray() instanceof AuxArray ).to.be( true );
      expect( Cast.toAuxArray( null ) instanceof AuxArray ).to.be( true );
      expect( Cast.toAuxArray( [] ) instanceof AuxArray ).to.be( true );
    });

    it('throws if it cannot convert', function() {
      var err;
      try {
        Cast.toAuxArray( ':(' );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an( Error );
      expect( err.message ).to.match( /failed.*cast/i );
    });

  });


  describe('.toString( val )', function() {

    it('casts value to a string', function() {
      expect( typeof Cast.toString( '1234' ) ).to.be( 'string' );
      expect( typeof Cast.toString( 1234 ) ).to.be( 'string' );
      expect( typeof Cast.toString( true ) ).to.be( 'string' );
      expect( typeof Cast.toString( new Date() ) ).to.be( 'string' );
      expect( typeof Cast.toString( function(){} ) ).to.be( 'string' );
      expect( typeof Cast.toString( {} ) ).to.be( 'string' );
      expect( typeof Cast.toString( [] ) ).to.be( 'string' );
    });

    it('casts objects as JSON', function() {
      expect( Cast.toString( {a:1, b:{c:2}}) ).to.be( '{"a":1,"b":{"c":2}}' );
    });

    it('returns null if value is null', function() {
      expect( Cast.toString( null ) ).to.be( null );
    });

    it('throws if it given `undefined`', function() {
      var err;
      try {
        Cast.toString( undefined );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an( Error );
      expect( err.message ).to.match( /failed.*cast/i );
    });

  });


  // Base number conversion utility
  describe('.convertNumber( val, conv, radix )', function () {

    it('default radix is 10', function() {
      expect( Cast.convertNumber( '100' ) ).to.be( 100 );
    });

    it('applies a radix base using parseInt if radix supplied', function() {
      expect( Cast.convertNumber( '12.15', null, 8 ) ).to.be( 10 );
      expect( Cast.convertNumber( 15.15, null, 8 ) ).to.be( 13 );
      expect( Cast.convertNumber( '12.15', null, 10 ) ).to.be( 12 );
    });

    it('throws if it cannot convert', function() {
      var err;
      try {
        Cast.convertNumber( {} );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an( Error );
    });

    describe('.toNumber( val )', function() {

      it('casts value to a number', function() {
        expect( typeof Cast.toNumber( '1234' ) ).to.be( 'number' );
        expect( typeof Cast.toNumber( 1234 ) ).to.be( 'number' );
        expect( typeof Cast.toNumber( true ) ).to.be( 'number' );
      });

      it('casts boolean values to 1 or 0', function() {
        expect( Cast.toNumber( true ) ).to.be( 1 );
        expect( Cast.toNumber( false ) ).to.be( 0 );
      });

      it('returns null if value is null', function() {
        expect( Cast.toNumber( null ) ).to.be( null );
      });

      it('throws if it cannot convert', function() {
        var err;
        try {
          Cast.toNumber( {} );
        }
        catch( e ) { err = e; }
        expect( err ).to.be.an( Error );
      });
    });

    describe('.toInteger( val, radix )', function() {
      it('delegates .toNumber with parseInt as convertor', function() {
        expect( Cast.toInteger( '44.23' ) ).to.be( 44 );
      });

      it('passes a radix if provided', function() {
        expect( Cast.toInteger( '011', 8) ).to.be( 9 );
      });
    });

    describe('.toFloat( val )', function() {
      it('delegates .toNumber with parseFloat as convertor', function() {
        expect( Cast.toFloat( '0.0314E+2' ) ).to.be( 3.14 );
      });
    });

  });


  describe('.toBoolean( val )', function() {

    it('casts value (everything) to a boolean', function() {
      expect( typeof Cast.toBoolean( '0' ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( 1234 ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( true ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( new Date() ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( function(){} ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( {} ) ).to.be( 'boolean' );
      expect( typeof Cast.toBoolean( [] ) ).to.be( 'boolean' );
    });

    it('converts string "0" and "1" appropriately', function() {
      expect( Cast.toBoolean('0') ).to.be( false );
      expect( Cast.toBoolean('1') ).to.be( true );
    });

    it('converts string "true" and "false" appropriately', function() {
      expect( Cast.toBoolean('false') ).to.be( false );
      expect( Cast.toBoolean('true') ).to.be( true );
    });

    it('returns null if value is null', function() {
      expect( Cast.toBoolean( null ) ).to.be( null );
    });

  });


  describe('.toDate( val )', function() {

    it('casts value to a Date', function() {
      expect( Cast.toDate( '1234' ) ).to.be.a( Date );
      expect( Cast.toDate( 1234 ) ).to.be.a( Date );
      expect( Cast.toDate( new Date() ) ).to.be.a( Date );
      expect( Cast.toDate( ['1'] ) ).to.be.a( Date );
    });

    it('returns null if value is null or ""', function() {
      expect( Cast.toDate( null ) ).to.be( null );
      expect( Cast.toDate( '' ) ).to.be( null );
    });

  });




});
