/**
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index')
  , Property = require('mekanika-property')


describe('Schema', function() {

  describe('Class', function() {

    it('sets Schema#key as lowercased identity', function(){
        expect( schema.new('Xbox').key ).to.equal( 'xbox' );
      });

    it('exposes .properties and .methods props', function() {
      var s = schema.new( '^' );
      expect( s.properties ).to.be.an.instanceof( Array );
      expect( s.methods ).to.be.an.instanceof( Array );
    });

    it('initialises (passthru) adapter if passed', function() {
      var O_o = new schema.Schema( '^_^', 'faux' );
      expect( O_o.adapter ).to.equal( 'faux' );
    });

  });


  describe('.options(opt)', function() {

    before( function () {
      schema.new('Demo').options( {validateOnSet: true} );
    });

    it('applies options( object ) as options', function() {
      expect( schema('Demo').options() ).to.be.an.instanceof( Object );
      expect( schema('Demo').options('validateOnSet') ).to.equal( true );
    });

    it('acts as a getter if passed a string .options( key )', function() {
      expect( schema('Demo').options('validateOnSet') ).to.equal( true );
    });

    it('acts as a setter if passed .options( key, val )', function() {
      expect( schema('Demo').options('validateOnSet', false) ).to.equal( false );
    });

    it.skip('can validateOnSet all Schema# record instances', function() {
      var Grunt = schema.new('Grunt').prop('name');

      Grunt.options('validateOnSet', true);

      function validYes(v) { return v==='yes'; }
      Grunt.path('name').addValidator( validYes, 'Must be yes' );

      var wat = Grunt.new();

      var err;
      try {
        wat.name = 'yes';
        expect( wat.name ).to.equal( 'yes' );
        wat.name = 'no';
      }
      catch( e ) { err = e; }

      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /Must be yes/ );
    });

  });


  describe('Paths', function() {

    var Dude;

    before( function () {
      Dude = schema.new('Dude').prop('name').prop('age').prop('cool');
    });

    it('.path(key) returns the Property identified by `key`', function() {
      expect( Dude.path('age').key ).to.equal( 'age' );
      expect( Dude.path('name').key ).to.equal( 'name' );
    });

    it('.path(key) returns undefined if `key` not found', function() {
      expect( Dude.path('random') ).to.equal( undefined );
    });

    it('.getPaths() returns flat array of Schema# properties', function() {
      expect( Dude.getPaths() ).to.be.an.instanceof( Array );
      expect( Dude.getPaths() ).to.contain( 'name', 'age', 'cool' );
    });

    it('.getRequiredPaths() returns array of required properties', function() {
      Dude.path('name').required(true);
      Dude.path('age').required(true);

      expect( Dude.getRequiredPaths() ).to.be.an.instanceof( Array );
      expect( Dude.getRequiredPaths() ).to.have.length( 2 );
      expect( Dude.getRequiredPaths() ).to.contain( 'name', 'age' );
    });

  });


  describe('.prop( Property ) [see Property tests]', function() {

    beforeEach( function () { schema.reset(); } );

    it('enables setting new schema properties', function() {
      var model = schema.new( 'Play' );
      model.prop( 'errorcode', {type:'integer', required:true} );

      expect( model.properties ).to.have.length( 1 );
      expect( model.properties[0].key ).to.equal( 'errorcode' );
    });

    it.skip('aliases as .property() and .attr()', function() {
      var model = schema.new('Play');
      model.attr( 'punch', {key:'punch', type:'integer'} );
      expect( model.properties[1].key ).to.equal( 'punch' );
      model.property( 'kick', {key:'kick', type:'integer'} );
      expect( model.properties[2].key ).to.equal( 'kick' );
    });

    it('no-ops setting a property that has already been set', function() {
      var test = schema.new('Doubleset').prop('onlyone');
      test.prop('onlyone');
      expect( test.properties.length ).to.equal( 1 );
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
      schema('^_^').prop('!', {required:true});
      var err;
      try {
        schema('^_^').validate('fakey!', 'ermehgerd!');
      }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /No.*?property/ );
    });

    it('returns error array from property validation', function () {
      schema('^_^').prop('!', {required:true});
      var errs = schema('^_^').validate('!', undefined);
      expect( errs ).to.be.an.instanceof( Array );
      expect( errs ).to.have.length( 1 );
    });

    it('returns empty array on all conditions passing rules', function () {
      schema('^_^').prop('!', {required:true});
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


  describe('.static( name, fn )', function() {

    it('applies a static method to Schema# instances', function() {
      var Bomb = schema.new('Bomb').static('bro', function(){ return 'supbra'; });

      expect( Bomb.bro ).to.be.a( 'function' );
      expect( Bomb.bro() ).to.equal( 'supbra' );
    });

  });



  describe('Middleware', function() {

    var Hero = schema.new('Hero');
    before( function() { schema.reset(); } );

    it('.pre( event, fn ) adds pre middleware to stack', function() {
      Hero.pre( 'save', function() { return 'yo'; } );

      expect( Hero._pre.save ).to.be.an.instanceof( Array );
      expect( Hero._pre.save ).to.have.length( 1 );
      expect( Hero._pre.save[0]() ).to.equal( 'yo' );
    });

    it('.post( event, fn ) adds post middleware to stack', function() {
      Hero.post( 'save', function() { return 'yo'; } );

      expect( Hero._post.save ).to.be.an.instanceof( Array );
      expect( Hero._post.save ).to.have.length( 3 );
      expect( Hero._post.save[2]() ).to.equal( 'yo' );
    });

    it.skip('applies middleware on query execution', function( done ) {
      Hero._pre = {};
      Hero._post = {};

      // Stub adapter to force return of (err, res) rather than ( Query# )
      Hero.useAdapter( {exec: function( q, cb ) { return cb(); }} );

      var preset;

      Hero.pre( 'save', function(q) { preset = q.action; } );
      Hero.post( 'save', function(e,r) {
        return [':(', ':)'];
      });

      function cb( err, res ) {
        expect( err ).to.equal( ':(' );
        expect( res ).to.equal( ':)' );
        expect( preset ).to.equal( 'save' );
        done();
      }

      Hero.save().done(cb);
    });

  });

});
