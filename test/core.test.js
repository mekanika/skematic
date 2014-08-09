/**
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index');



describe('Core - schema', function() {

  beforeEach( function() { schema.reset(); } );

  it('loads the schema library', function() {
    expect( schema ).to.be.a( "function" );
  });

  it('exposes Schema constructor as schema.Schema', function() {
    expect( schema.Schema ).to.be.a( "function" );
  });

  it('.list() returns all declared schema keys', function() {
    expect( schema.list() ).to.be.empty;

    schema.new('^_^');
    schema.new('o_O');

    expect( schema.list() ).to.contain( '^_^', 'o_O' );
  });

  it('.has( id ) returns boolean existence of schema `id`', function () {
    schema.new('mega');
    expect( schema.has( 'mega' ) ).to.be.true;
    expect( schema.has( 'nope' ) ).to.be.false;
  });

  it('.unload( id ) removes the `id` from schema cache', function () {
    schema.new('deleteme');
    expect( schema.list() ).to.contain( 'deleteme' );
    var retval = schema.unload( 'deleteme' );
    expect( schema.list() ).to.not.contain( 'deleteme' );
    expect( retval ).to.be.true;
  });

  it('.unload( id ) returns false if no `id` found', function () {
    expect( schema.unload('blah') ).to.be.false;
  });


  describe('accessor - schema(key)', function () {
    it('throws if no key provided', function () {
      expect( schema ).to.throw( Error );
    });

    it('throws error if schema key not found', function () {
      var err;
      try { schema('derp'); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /find.*?schema/ig );
    });

    it('returns a cached Schema if one exists', function() {
      schema.new('Demo');
      expect( schema( 'Demo' ) ).to.equal( schema('Demo') );
    });
  });


  describe('.reset()', function() {

    it('unassigns any declared global adapter', function() {
      expect( schema.new('^_^').adapter ).to.be.undefined;
      schema.useAdapter( {exec:function(){}});
      expect( schema.new('O_o').adapter ).to.be.ok;

      schema.reset();
      expect( schema.new('_!_').adapter ).to.be.undefined;
    });

    it('is able to schema.reset() internal cache', function() {
      expect( schema.list() ).to.have.length( 0 );
      schema.new('^_^');
      expect( schema.list() ).to.have.length( 1 );
      schema.reset();

      expect( schema.list() ).to.have.length( 0 );
    });

  });


  describe('Adapter - .useAdapter()', function() {

    var _a = {exec: function(){}};

    beforeEach( function() { schema.reset(); } );

    it('sets adapter for new schemas', function() {
      expect( schema.new('first').adapter ).to.be.undefined;
      schema.useAdapter( _a );
      expect( schema.new('second').adapter ).to.equal( _a ) ;
    });

    it('does not override existing schema declared adapters', function() {
      schema.new('^_^').useAdapter( {exec:function(){ return false; }} );

      schema.useAdapter( _a );
      expect( schema('^_^').adapter ).to.not.equal( _a );
    });

    it('applies adapter to existing schemas that have none', function() {
      schema.new('^_^');
      expect( schema('^_^').adapter ).to.be.undefined;

      schema.useAdapter( _a );
      expect( schema('^_^').adapter ).to.equal( _a );
    });

  });


  describe('instantiation: .new(key)', function() {

    beforeEach( function () {
      schema.new('Demo');
    });

    it('creates a new Schema# object', function() {
      expect( schema('Demo') ).to.be.an.instanceof( schema.Schema );
    });

    it('fails to create if schema key already exists', function () {
      var err;
      schema.new('!');

      try { schema.new('!'); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /Already.*?exists/ig );
    });

    it('fails to initialise if not passed a name property', function() {
      var err;
      try {
        schema.new();
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /requires.*key/i );
    });

    it('applies the schema( key ) as Schema#key', function() {
      expect( schema( 'Demo' ).key ).to.equal( 'Demo' );
    });
  });

});
