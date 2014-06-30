/**
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index');



describe('Core - schema', function() {

  beforeEach( function() { schema.reset(); } );

  describe('Library:', function() {

    it('loads the schema library', function() {
      expect( schema ).to.be.a( "function" );
    });

    it('exposes Schema constructor as schema.Schema', function() {
      expect( schema.Schema ).to.be.a( "function" );
    });

    it('.list() returns all declared schema keys', function() {
      expect( schema.list() ).to.be.empty;

      schema('^_^');
      schema('o_O');

      expect( schema.list() ).to.contain( '^_^', 'o_O' );
    });

    it('.has( id ) returns boolean existence of schema `id`', function () {
      schema('mega');
      expect( schema.has( 'mega' ) ).to.be.true;
      expect( schema.has( 'nope' ) ).to.be.false;
    });

    it('.unload( id ) removes the `id` from schema cache', function () {
      schema('deleteme');
      expect( schema.list() ).to.contain( 'deleteme' );
      var retval = schema.unload( 'deleteme' );
      expect( schema.list() ).to.not.contain( 'deleteme' );
      expect( retval ).to.be.true;
    });

    it('.unload( id ) returns false if no `id` found', function () {
      expect( schema.unload('blah') ).to.be.false;
    });

    it('returns the toString() accessor as "schema( modelName )"', function() {
      expect( schema('Demo').toString() ).to.equal( "schema('Demo')" );
    });


    describe('.reset()', function() {

      beforeEach( function() { schema.reset(); } );

      it('unassigns any declared global adapter', function() {
        expect( schema('^_^').adapter ).to.be.undefined;
        schema.useAdapter( {exec:function(){}});
        expect( schema('O_o').adapter ).to.be.ok;

        schema.reset();
        expect( schema('_!_').adapter ).to.be.undefined;
      });

      it('is able to schema.reset() internal cache', function() {
        expect( schema.list() ).to.have.length( 0 );
        schema('^_^');
        expect( schema.list() ).to.have.length( 1 );
        schema.reset();

        expect( schema.list() ).to.have.length( 0 );
      });

    });

  });


  describe('Adapter - .useAdapter()', function() {

    var _a = {exec: function(){}};

    beforeEach( function() { schema.reset(); } );

    it('sets adapter for new schemas', function() {
      expect( schema('first').adapter ).to.be.undefined;
      schema.useAdapter( _a );
      expect( schema('second').adapter ).to.equal( _a ) ;
    });

    it('does not override existing schema declared adapters', function() {
      schema('^_^').useAdapter( {exec:function(){ return false; }} );

      schema.useAdapter( _a );
      expect( schema('^_^').adapter ).to.not.equal( _a );
    });

    it('applies adapter to existing schemas that have none', function() {
      schema('^_^');
      expect( schema('^_^').adapter ).to.be.undefined;

      schema.useAdapter( _a );
      expect( schema('^_^').adapter ).to.equal( _a );
    });

  });


  describe('instantiation:', function() {

    it('creates a new Schema# object', function() {
      var model = schema( 'Demo' );
      expect( model ).to.be.an.instanceof( schema.Schema );
    });

    it('throws if the schema name is reserved', function ( done ) {
      try { schema('integer'); }
      catch ( e ) {
        expect( e.message ).to.match( /reserved/ );
        done();
      }
    });

    it('returns a cached Schema if one exists', function() {
      expect( schema( 'Demo' ) ).to.equal( schema('Demo') );
    });

    it('fails to initialise if not passed a name property', function() {
      var err;
      try {
        schema();
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /requires.*name/ );
    });

    it('applies the schema( name ) as Schema#identity', function() {
      expect( schema( 'Demo' ).identity ).to.equal( 'Demo' );
    });
  });

});