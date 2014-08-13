/**
 * Test dependencies
 */

var expect = require('chai').expect
  , accessor = require('../index');



describe('Core - accessor()', function() {

  beforeEach( function() { accessor.reset(); } );

  it('loads the accessor library', function() {
    expect( accessor ).to.be.a( "function" );
  });

  it('exposes Model constructor as accessor.Model', function() {
    expect( accessor.Model ).to.be.a( "function" );
  });

  it('exposes schema library', function() {
    expect( accessor.schema ).to.exist;
  });

  it('.list() returns all declared model keys', function() {
    expect( accessor.list() ).to.be.empty;

    accessor.new('^_^');
    accessor.new('o_O');

    expect( accessor.list() ).to.contain( '^_^', 'o_O' );
  });

  it('.has( id ) returns boolean existence of modle `id`', function () {
    accessor.new('mega');
    expect( accessor.has( 'mega' ) ).to.be.true;
    expect( accessor.has( 'nope' ) ).to.be.false;
  });

  it('.unload( id ) removes the `id` from model cache', function () {
    accessor.new('deleteme');
    expect( accessor.list() ).to.contain( 'deleteme' );
    var retval = accessor.unload( 'deleteme' );
    expect( accessor.list() ).to.not.contain( 'deleteme' );
    expect( retval ).to.be.true;
  });

  it('.unload( id ) returns false if no `id` found', function () {
    expect( accessor.unload('blah') ).to.be.false;
  });


  describe('accessor(key)', function () {
    it('throws if no key provided', function () {
      expect( accessor ).to.throw( Error );
    });

    it('throws error if model key not found', function () {
      var err;
      try { accessor('derp'); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /find.*?schema/ig );
    });

    it('returns a cached Model if one exists', function() {
      accessor.new('Demo');
      expect( accessor( 'Demo' ) ).to.equal( accessor('Demo') );
    });
  });


  describe('.reset()', function() {

    it('unassigns any declared global adapter', function() {
      expect( accessor.new('^_^').adapter ).to.be.undefined;
      accessor.useAdapter( {exec:function(){}});
      expect( accessor.new('O_o').adapter ).to.be.ok;

      accessor.reset();
      expect( accessor.new('_!_').adapter ).to.be.undefined;
    });

    it('is able to .reset() internal cache', function() {
      expect( accessor.list() ).to.have.length( 0 );
      accessor.new('^_^');
      expect( accessor.list() ).to.have.length( 1 );
      accessor.reset();

      expect( accessor.list() ).to.have.length( 0 );
    });

  });


  describe('Adapter - .useAdapter()', function() {

    var _a = {exec: function(){}};

    beforeEach( function() { accessor.reset(); } );

    it('sets adapter for new Models', function() {
      expect( accessor.new('first').adapter ).to.be.undefined;
      accessor.useAdapter( _a );
      expect( accessor.new('second').adapter ).to.equal( _a ) ;
    });

    it('does not override existing model declared adapters', function() {
      accessor.new('^_^').useAdapter( {exec:function(){ return false; }} );

      accessor.useAdapter( _a );
      expect( accessor('^_^').adapter ).to.not.equal( _a );
    });

    it('applies adapter to existing models that have none', function() {
      accessor.new('^_^');
      expect( accessor('^_^').adapter ).to.be.undefined;

      accessor.useAdapter( _a );
      expect( accessor('^_^').adapter ).to.equal( _a );
    });

  });


  describe('instantiation: .new(key)', function() {

    beforeEach( function () {
      accessor.new('Demo');
    });

    it('creates a new Model# object', function() {
      expect( accessor('Demo') ).to.be.an.instanceof( accessor.Model );
    });

    it('fails to create if model key already exists', function () {
      var err;
      accessor.new('!');

      try { accessor.new('!'); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /Already.*?exists/ig );
    });

    it('fails to initialise if not passed a name property', function() {
      var err;
      try {
        accessor.new();
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /requires.*key/i );
    });

    it('applies the accessor( key ) as Model#key', function() {
      expect( accessor( 'Demo' ).key ).to.equal( 'Demo' );
    });
  });

});
