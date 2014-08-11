/**
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index');


describe('Schema', function() {

  beforeEach( function () { schema.reset(); });

  describe('Class', function() {

    it('sets Schema#resource as lowercased key (id)', function(){
        expect( schema.new('Xbox').resource ).to.equal( 'xbox' );
      });

    it('exposes .properties and .methods props', function() {
      var s = schema.new( '^' );
      expect( s.properties ).to.exist;
      expect( s.methods ).to.be.an.instanceof( Array );
    });

    it('initialises (passthru) adapter if passed', function() {
      var O_o = new schema.Schema( '^_^', 'faux' );
      expect( O_o.adapter ).to.equal( 'faux' );
    });

    it('can pass initialisation options', function () {
      var s = schema.new('!', {validateOnSet: true} );
      expect( s.config.validateOnSet ).to.equal( true );
    });

    it('defaults .idAttribute to `id`', function () {
      var s = schema.new('!');
      expect( s.idAttribute ).to.equal( 'id' );
    });

  });


  describe('.config', function() {
    describe('defaults', function () {
      it('validateOnSet: false', function () {
        expect( schema.new('!').config.validateOnSet ).to.be.false;
      });

      it('castOnSet: true', function () {
        expect( schema.new('!').config.castOnSet ).to.be.true;
      });
    });
  });


  describe('Paths', function() {

    var Dude;

    before( function () {
      Dude = schema.new('Dude').prop('name').prop('age').prop('cool');
    });

    it('.path(key) returns the Property identified by `key`', function() {
      expect( Dude.path('age') ).to.not.be.undefined;
    });

    it('.path(key) returns undefined if `key` not found', function() {
      expect( Dude.path('random') ).to.equal( undefined );
    });

    it('.getPaths() returns flat array of Schema# properties', function() {
      expect( Dude.getPaths() ).to.be.an.instanceof( Array );
      expect( Dude.getPaths() ).to.contain( 'name', 'age', 'cool' );
    });

    it('.getRequiredPaths() returns array of required properties', function() {
      Dude.path('name').required = true;
      Dude.path('age').required = true;

      expect( Dude.getRequiredPaths() ).to.be.an.instanceof( Array );
      expect( Dude.getRequiredPaths() ).to.have.length( 2 );
      expect( Dude.getRequiredPaths() ).to.contain( 'name', 'age' );
    });

  });


  describe('.prop( Property ) [see Property tests]', function() {

    beforeEach( function () { schema.reset(); } );

    it('enables setting new properties', function() {
      var model = schema.new( 'Play' );
      model.prop( 'errorcode', {type:'integer', required:true} );

      expect( model.properties.errorcode ).to.exist;
    });

    it('supports {type: $schemaKey} to set type as other schema', function () {
      schema.new('xman');
      schema.new('play').prop('test', {type:'xman'});
    });

    // @todo
    it.skip('validates schema on setting property', function () {
      var err;
      try { schema.new('play').prop('test', {type:'xman'}); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /find schema/ig );
    });

    it('aliases as .property() and .attr()', function() {
      var model = schema.new('Play');
      expect( model.property ).to.equal( model.prop );
      expect( model.attr ).to.equal( model.prop );
    });

    it('overwrites a property that already exists', function() {
      var test = schema.new('Doubleset').prop('onlyone', {required:true});
      expect( test.path('onlyone').required ).to.be.true;
      test.prop('onlyone');
      expect( test.path('onlyone').required ).to.be.undefined;
    });

    describe('Property options', function () {

      it('set a foreign key reference as {ref:"Schema.prop"}', function () {
        schema.new('^_^').prop('post_id', {ref:'Post.id'});
        expect( schema('^_^').path('post_id').ref ).to.equal( 'Post.id' );
      });

    });

  });


  describe('.validate( property, value )', function () {
    it('throws an error if the `property` does not resolve', function () {
      schema.new('^_^').prop('!', {required:true});
      var err;
      try {
        schema('^_^').validate('fakey!', 'ermehgerd!');
      }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /No.*?property/ );
    });

    it('returns error array from property validation', function () {
      schema.new('^_^').prop('!', {required:true});
      var errs = schema('^_^').validate('!', undefined);
      expect( errs ).to.be.an.instanceof( Array );
      expect( errs ).to.have.length( 1 );
    });

    it('returns empty array on all conditions passing rules', function () {
      schema.new('^_^').prop('!', {required:true});
      var errs = schema('^_^').validate('!', 'WOOO!');
      expect( errs ).to.have.length( 0 );
    });
  });


  describe('.method( methodName, fn )', function() {

    beforeEach( function () {
      schema.reset();
    });

    it('fails to set method if not passed both parameters', function() {
      var model = schema.new( 'Play' );

      var err;
      // Check with no paramters
      try {
        model.method();
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /define.*both/ );

      // Try passing no `fn` method
      err = undefined;
      try {
        model.method( 'hello' );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /define.*both/ );

      // Try with not a string
      err = undefined;
      try {
        model.method( undefined, function(){} );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /define.*both/ );
    });

    it('fails if not passed `string`, `function`', function() {
      var model = schema.new('Play');
      var err;

      // Pass a non string
      try {
        model.method( true, function(){} );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /must be a String/ );

      // Pass a non function
      err = undefined;
      try {
        model.method( 'methodname', 'notafunction :(' );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /must be a Function/ );
    });

    it('enables setting new schema methods', function() {
      var model = schema.new( 'Play' );

      var fn = function() {};
      model.method( 'moonShot', fn );

      expect( model.methods ).to.have.length( 1 );
      expect( model.methods[0].key ).to.equal( 'moonShot' );
      expect( model.methods[0].fn ).to.equal( fn );
    });
  });


  describe.skip('.new()', function () {
    it('fails if `Record` not available', function () {
      var err;
      try { schema.new('x').new(); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /no record/ig );
    });

    it('instantiates new Record() if present', function () {
      GLOBAL.Record = function () {};
      expect( schema.new('x').new() ).to.be.an.instanceof( Record );
      delete GLOBAL.Record;
    });
  });


  describe('Adapter - .useAdapter(a)', function () {

    var stubAdapter = {exec: function( q, cb ) { return cb(); }};
    beforeEach( function () { schema.reset(); } );

    it('throws if adapter has no .exec() default', function () {
      var err;
      try { schema.new('!').useAdapter( {} ); }
      catch (e) { err = e; }

      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /valid adapter/ig );
    });

    it('applies an adapter to the schema', function () {
      schema.new('!').useAdapter( stubAdapter );

    });
  });


  describe('Middleware', function() {

    var Hero;
    beforeEach( function() { schema.reset(); Hero = schema.new('Hero'); } );

    it('.pre( event, fn ) adds "named" pre middleware to stack', function() {
      Hero.pre( 'save', function() { return 'yo'; } );

      expect( Hero._pre.save ).to.be.an.instanceof( Array );
      expect( Hero._pre.save ).to.have.length( 1 );
      expect( Hero._pre.save[0]() ).to.equal( 'yo' );
    });

    it('.post( event, fn ) adds "named" post middleware to stack', function() {
      Hero.post( 'save', function() { return 'yo'; } );

      expect( Hero._post.save ).to.be.an.instanceof( Array );
      expect( Hero._post.save ).to.have.length( 1 );
      expect( Hero._post.save[0]() ).to.equal( 'yo' );
    });

    it('supports passing hook as pure (fn) ie. "all" event', function () {
      Hero.pre( function (ref) { return ref+1; } );
      expect( Hero._pre.all ).to.have.length( 1 );
      expect( Hero._pre.all[0](1) ).to.equal( 2 );
    });

  });

  describe('.normaliseType', function () {

    var Schema = require('../src/schema');

    it('returns undefined immediately if no type param', function () {
      expect( Schema.normaliseType() ).to.be.undefined;
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
        var conv = Schema.normaliseType( t );
        expect( map[ conv ] ).to.equal( t );
      });
    });

    it('matches all known type strings', function () {
      // Lifted straight from /src/schema.js _normaliseType()
      var types = {
          boolean: 'boolean'
        , date: 'date'
        , float: 'float'
        , integer: 'integer'
        , number: 'number'
        , regexp: 'regexp'
        , string: 'string'
      };
      var keys = Object.keys( types );
      keys.forEach( function ( t ) {
        expect( Schema.normaliseType(t) ).to.equal( types[ t ] );
      });
    });

    it('throws if type is array (special case handling)', function (done) {
      try { Schema.normaliseType( Array ); }
      catch (e) {
        try { Schema.normaliseType( 'Array' ); }
        catch ( e2 ) {
          try { Schema.normaliseType( 'array' ); }
          catch( e3 ) {
            done();
          }
        }
      }
    });

    it('returns false if nothing matches', function () {
      expect( Schema.normaliseType( 'o_o' ) ).to.be.false;
    });

  });

});
