
/**
 * Test dependencies
 */

var AuxArray = require('../lib/array')
  , schema = require('mekanika-schema')
  , expect = require('expect.js');


describe('AuxArray', function() {

  describe('initialising', function() {

    it('inherits from Array', function() {
      var a = new AuxArray();
      expect( a ).to.be.an( Array );
    });

    it('applies values parameter as array contents', function() {
      var a = new AuxArray( [1,'two', 55] );
      expect( a.length ).to.be( 3 );
      expect( a ).to.contain( 1, 'two', 55 );
    });

    it('sets internal casting reference if passed', function() {
      var a = new AuxArray( undefined, {woo:'woo'} );
      expect( a._castAs ).to.not.be.empty();
    });

    it('can force legacy mode [object Object] inheritance', function() {
      var a = new AuxArray( [], null, true );
      expect( Array.isArray( a ) ).to.be( false );

      // Doublecheck 'correct' subclassing (node supports __proto__)
      a = new AuxArray();
      expect( Array.isArray( a ) ).to.be( true );
    });

  });


  describe('Casting to Schema', function() {

    before( function() { schema('^_^').prop('name', {default:':)'}); } );
    after( function() { schema.reset(); } );

    it('no-ops if no schema is set', function() {
      var a = new AuxArray();
      expect( a._innerCast( '!' ) ).to.be( '!' );
    });

    it('casts a value to the defined AuxArray schema', function() {
      var a = new AuxArray( undefined, schema('^_^') );
      expect( a._innerCast().name ).to.be( ':)' );
    });

    it('pre-casts initialised values if passed', function() {
      var a = new AuxArray( [{name:'>:P'}], schema('^_^') );
      expect( a[0] ).to.be.a( schema.Record );
      expect( a[0].$schema.identity ).to.be( '^_^' );
    });

  });


  describe('Methods', function() {

    before( function() { schema('^_^').prop('name', {default:':)'}); } );
    after( function() { schema.reset(); } );

    it('.push() casts pushed values', function() {
      var a = new AuxArray( [], schema('^_^') );
      a.push( {}, {name:'smoo'} );
      expect( a ).to.have.length( 2 );
      expect( a[0].name ).to.be(':)');
      expect( a[1].name ).to.be('smoo');
    });

    it('.unshift() casts unshifted values', function() {
      var a = new AuxArray( [], schema('^_^') );
      a.unshift( {} );
      // Unshift onto front of array
      a.unshift( {name:'smoo'} );
      expect( a ).to.have.length( 2 );
      expect( a[1].name ).to.be(':)');
      expect( a[0].name ).to.be('smoo');
    });

    it('.set( index, value ) sets cast value at index', function() {
      var a = new AuxArray( [ {} ], schema('^_^') );
      a.set( 1, {name:'smoo'} );
      expect( a[0].name ).to.be( ':)' );
      expect( a[1].name ).to.be( 'smoo' );
    });

  });


  describe('Inspect (console)', function() {

    it('returns an Array', function() {
      var a = new AuxArray([1,'two']);
      expect( Array.isArray( a.inspect() ) ).to.be( true );
    });

    // In legacy situations, where length is not correct, slice() fails
    it('returns array of the same length as the AuxArray elements', function() {
      var a = new AuxArray( [1,'>:|'], null, true );
      expect( a.inspect() ).to.have.length( 2 );
    });

  });


});
