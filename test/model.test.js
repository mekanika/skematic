/**
 * Test dependencies
 */

var expect = require('chai').expect
  , accessor = require('../index');


describe('Model', function() {

  beforeEach( function () { accessor.reset(); });

  describe('Class', function() {

    it('sets Model#resource as lowercased key (id)', function(){
        expect( accessor.new('Xbox').resource ).to.equal( 'xbox' );
      });

    it('exposes .properties and .methods props', function() {
      var s = accessor.new( '^' );
      expect( s.properties ).to.exist;
      expect( s.methods ).to.be.an.instanceof( Array );
    });

    it('initialises (passthru) adapter if passed', function() {
      var O_o = new accessor.Model( '^_^', 'faux' );
      expect( O_o.adapter ).to.equal( 'faux' );
    });

    it('can pass initialisation options', function () {
      var s = accessor.new('!', {validateOnSet: true} );
      expect( s.config.validateOnSet ).to.equal( true );
    });

    it('defaults .idAttribute to `id`', function () {
      var s = accessor.new('!');
      expect( s.idAttribute ).to.equal( 'id' );
    });

  });


  describe('.config', function() {
    describe('defaults', function () {
      it('validateOnSet: false', function () {
        expect( accessor.new('!').config.validateOnSet ).to.be.false;
      });

      it('castOnSet: true', function () {
        expect( accessor.new('!').config.castOnSet ).to.be.true;
      });
    });
  });


  describe('Paths', function() {

    var Dude;

    before( function () {
      Dude = accessor.new('Dude').prop('name').prop('age').prop('cool');
    });

    it('.path(key) returns the Property identified by `key`', function() {
      expect( Dude.path('age') ).to.not.be.undefined;
    });

    it('.path(key) returns undefined if `key` not found', function() {
      expect( Dude.path('random') ).to.equal( undefined );
    });

    it('.getPaths() returns flat array of Model# properties', function() {
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

    beforeEach( function () { accessor.reset(); } );

    it('enables setting new properties', function() {
      var model = accessor.new( 'Play' );
      model.prop( 'errorcode', {type:'integer', required:true} );

      expect( model.properties.errorcode ).to.exist;
    });

    it('aliases as .property() and .attr()', function() {
      var model = accessor.new('Play');
      expect( model.property ).to.equal( model.prop );
      expect( model.attr ).to.equal( model.prop );
    });

    it('overwrites a property that already exists', function() {
      var test = accessor.new('Doubleset').prop('onlyone', {required:true});
      expect( test.path('onlyone').required ).to.be.true;
      test.prop('onlyone');
      expect( test.path('onlyone').required ).to.be.undefined;
    });

    describe('Property options', function () {

      it('set a foreign key reference as {ref:"Model.prop"}', function () {
        accessor.new('^_^').prop('post_id', {ref:'Post.id'});
        expect( accessor('^_^').path('post_id').ref ).to.equal( 'Post.id' );
      });

    });

  });


  describe('.validate( property, value )', function () {
    it('throws an error if the `property` does not resolve', function () {
      accessor.new('^_^').prop('!', {required:true});
      var err;
      try {
        accessor('^_^').validate('fakey!', 'ermehgerd!');
      }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /No.*?property/ );
    });

    it('returns error array from property validation', function () {
      accessor.new('^_^').prop('!', {required:true});
      var errs = accessor('^_^').validate('!', undefined);
      expect( errs ).to.be.an.instanceof( Array );
      expect( errs ).to.have.length( 1 );
    });

    it('returns empty array on all conditions passing rules', function () {
      accessor.new('^_^').prop('!', {required:true});
      var errs = accessor('^_^').validate('!', 'WOOO!');
      expect( errs ).to.have.length( 0 );
    });
  });


  describe('.method( methodName, fn )', function() {

    beforeEach( function () {
      accessor.reset();
    });

    it('fails to set method if not passed both parameters', function() {
      var model = accessor.new( 'Play' );

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
      var model = accessor.new('Play');
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

    it('enables setting new model methods', function() {
      var model = accessor.new( 'Play' );

      var fn = function() {};
      model.method( 'moonShot', fn );

      expect( model.methods ).to.have.length( 1 );
      expect( model.methods[0].key ).to.equal( 'moonShot' );
      expect( model.methods[0].fn ).to.equal( fn );
    });
  });


  describe('Adapter - .useAdapter(a)', function () {

    var stubAdapter = {exec: function( q, cb ) { return cb(); }};
    beforeEach( function () { accessor.reset(); } );

    it('throws if adapter has no .exec() default', function () {
      var err;
      try { accessor.new('!').useAdapter( {} ); }
      catch (e) { err = e; }

      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /valid adapter/ig );
    });

    it('applies an adapter to the model', function () {
      accessor.new('!').useAdapter( stubAdapter );

    });
  });


  describe('Middleware', function() {

    var Hero;
    beforeEach( function() { accessor.reset(); Hero = accessor.new('Hero'); } );

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

});
