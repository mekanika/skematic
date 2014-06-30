
/**
 * Dependencies
 */

var utils = require( '../src/utils' )
  , expect = require('chai').expect
  , types = require('../src/reservedtypes').reservedTypes;


describe('Utils', function() {

  describe('.clean( obj )', function() {

    it('removes undefined keys from first level of an object', function() {

      var o = {a:1, b:undefined};
      expect( utils.clean( o ) ).to.not.have.keys( 'b' );
    });

    it('cleans arrays of objects', function() {

      var a = [ {a:1, b:undefined}, {c:2, d:undefined} ];
      var cleaned = utils.clean( a );

      expect( cleaned ).to.be.an.instanceof( Array );
      expect( cleaned.length ).to.equal( 2 );
      expect( cleaned[0] ).to.not.have.keys( 'b' );
      expect( cleaned[1] ).to.not.have.keys( 'd' );
    });

    it('passes through anything not an object or array', function() {

      expect( utils.clean( true ) ).to.equal( true );
      expect( utils.clean( 1234 ) ).to.equal( 1234 );
      expect( utils.clean( 'hi' ) ).to.equal( 'hi' );
      expect( utils.clean( null ) ).to.equal( null );
      expect( utils.clean( undefined ) ).to.be.undefined;

    });

  });


  describe('.normaliseType', function () {

    it('returns undefined immediately if no type param', function () {
      expect( utils.normaliseType() ).to.be.undefined;
    });

    it('normalises known Primitives to strings', function () {
      var map = {
          date: Date
        , number: Number
        , string: String
        , boolean: Boolean
        , regexp: RegExp
      };

      [ Date, Number, String, Boolean, RegExp ].forEach( function (t) {
        var conv = utils.normaliseType( t );
        expect( map[ conv ] ).to.equal( t );
      });
    });

    it('matches all known type strings', function () {
      var keys = Object.keys( types );
      keys.forEach( function ( t ) {
        expect( utils.normaliseType(t) ).to.equal( types[ t ] );
      });
    });

    it('throws if type is array (special case handling)', function (done) {
      try { utils.normaliseType( Array ); }
      catch (e) {
        try { utils.normaliseType( 'Array' ); }
        catch ( e2 ) {
          try { utils.normaliseType( 'array' ); }
          catch( e3 ) {
            done();
          }
        }
      }
    });

    it('returns false if nothing matches', function () {
      expect( utils.normaliseType( 'o_o' ) ).to.be.false;
    });

  });

});
