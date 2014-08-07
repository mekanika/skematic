/**
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index')
  , Property = require('../src/property');


// Overwrite schema.new() implementation
schema.Schema.prototype.new = function (res) {
  res || (res = {});

  for (var key in res) {
    res[key] = '_invoked';
  }
  res._invoked = true;
  res.$schema = this;
  return res;
};


describe('Property', function() {

  it('fails if not initialised with a String key prop', function() {
    var err, p;
    try {
      p = new Property();
    }
    catch( e ) {err = e;}
    expect( err ).to.be.an.instanceof( Error );
    expect( err.message ).to.match( /requires.*key/ );

    err = undefined;
    try {
      p = new Property( 1234 );
    }
    catch( e ) { err = e; }
    expect( err ).to.be.an.instanceof( Error );
    expect( err.message ).to.match( /requires.*string/ );
  });

  it('creates a new property', function() {
    var initial = {type:'integer', required:true};
    var prop = new Property( 'errorcode', initial );

    expect( prop.type ).to.equal( initial.type );
    expect( prop.key ).to.equal( 'errorcode' );
    expect( prop.isRequired ).to.equal( initial.required );
  });

  it('construct( key ) correctly with only a key', function() {
    var prop = new Property( 'woo' );
    expect( prop.key ).to.equal( 'woo' );
  });

  it('rejects an invalid key being initialised on create', function() {
    var err;
    try {
      var prop = new Property( {junk:'break'} );
    }
    catch( e ) { err = e; }
    expect( err ).to.be.an.instanceof( Error );
    expect( err.message ).to.match( /requires/ );
  });

  it('retains `key` value even if passed in options', function() {
    var p = new Property('!', {key:'?'});
    expect( p.key ).to.equal( '!' );
  });


  describe('Cast Type', function() {

    it('assigns .caster function based on type name', function() {
      var t = ['string', 'number', 'integer', 'float', 'boolean', 'date'];
      t.forEach( function( type ) {
        var p = new Property( 'woo', {type:type} );
        expect( p.caster.name.toLowerCase() ).to.equal( 'to'+type );
      });
    });

    it('.cast( val ) returns cast value if a caster fn declared', function() {
      var p = new Property( 'woo', {type:'string'} );
      expect( p.cast( 1234 ) ).to.equal( '1234' );
    });

    it('.cast( val ) returns no-op val if no caster fn', function() {
      var p = new Property( 'woo' );
      expect( p.cast( '!') ).to.equal( '!' );
    });

    it('.cast( val ) passes through property.type if set', function( done ) {
      var p = new Property( '!', {type:{a:1}} );
      // Stub caster to test arity + params
      p.caster = function() {
        expect( arguments.length ).to.equal( 2 );
        expect( arguments[1] ).to.have.keys( 'a' );
        done();
      };
      p.cast( 1 );
    });

    it('casts to a single Schema instance', function () {
      schema.new('!').prop('buzzed', {default:'Moomoo'});
      var p = new Property('woo', {type: schema('!') });
      var rec = p.cast({});
      expect( rec._invoked ).to.true;
    });

    it('casts an array of Schema models', function () {
      schema('!').prop('name', {default:'Moomoo'});
      var p = new Property('woo', {type:schema('!'), array:true});
      var casted = p.cast( [{age:42}, {name:'Bob', age:21}]);
      expect( casted ).to.be.an.instanceof( Array );
      // Check that our stub schema.new() was invoked
      expect( casted[0]._invoked ).to.true;
    });

    it('casts an array of values to a defined type', function () {
      var p = new Property('woo', {type:'number', array:true});
      var casted = p.cast( [true, '3'] );
      expect( casted ).to.be.an.instanceof( Array );
      expect( typeof casted[0] ).to.equal( 'number' );
      expect( typeof casted[1] ).to.equal( 'number' );
    });

  });


  describe('.required()', function() {
    it('initialises isRequired based on options.required', function() {
      var prop = new Property('woo', {required: true});
      expect( prop.isRequired ).to.true;

      prop.required( false );
      expect( prop.isRequired ).to.equal( false );
    });

    it('applies/removes a required validator on options.required', function() {
      var p = new Property('woo', {required:true});
      expect( p.validators ).to.have.length( 1 );
      // Run validation on undefined -- should fail (ie. errs = [ err ]; )
      expect( p.validate(undefined) ).to.have.length( 1 );
    });
  });


  describe('.default()', function() {
    it('initialises a defaultValue based on options.default', function() {
      var prop = new Property('smoo', {
        default: 'foobar'
      });

      expect( prop.default() ).to.equal( 'foobar' );
    });

    it('returns the defaultValue if no argument passed', function() {
      var p = new Property('wat').default('ermergerd');
      expect( p.default() ).to.equal( 'ermergerd' );
    });

    it('returns Property if argument passed', function() {
      var p = new Property('wat').default('hello');
      expect( p ).to.be.an.instanceof( Property );
    });

  });


  describe('Transforms', function() {

    it('.set( fn ) adds a transform method to setters array', function() {
      var p = new Property('wat');
      expect( p.setters ).to.have.length( 0 );
      p.set( function() { return 'woo'; });
      expect( p.setters ).to.have.length( 1 );
    });

    it('fails to .set(fn) if not passed a function', function() {
      var err;
      try {
        var p = new Property('wat').set( 'boo' );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /set.*requires/ );
    });

    it('.applySetters(v) runs ordered setters, returning modified value', function() {
      var p = new Property('wat');
      p.set( function(v) { return v.toUpperCase(); });
      p.set( function(v) { return v+' (whatever)'; });

      var res = p.applySetters( 'dude' );
      expect( res ).to.equal( 'DUDE (whatever)');
    });

    it('.get( fn ) adds a transform method to setters array', function() {
      var p = new Property('wat');
      expect( p.getters ).to.have.length( 0 );
      p.get( function() { return 'woo'; });
      expect( p.getters ).to.have.length( 1 );
    });

    it('fails to .get(fn) if not passed a function', function() {
      var err;
      try {
        var p = new Property('wat').get( 'boo' );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /get.*requires/ );
    });

    it('.applyGetters(v) runs ordered getters, returning modified value', function() {
      var p = new Property('wat');
      p.get( function(v) { return v.toUpperCase(); });
      p.get( function(v) { return v+' (cardude)'; });

      var res = p.applyGetters( 'dude' );
      expect( res ).to.equal( 'DUDE (cardude)');
    });

  });


  describe('Validation', function() {

    var demoValid = function( val ) {
        return val === 'demo';
      };

    it('.addValidator(rule) can add a validation rule', function() {
      var p = new Property('wat');
      p.addValidator( demoValid );

      expect( p.validators() ).to.have.length( 1 );
      expect( p.validators()[0].rule ).to.equal( demoValid );
      expect( p.validators()[0].msg ).to.equal( 'Validation failed' );
    });

    it('.addValidator() with no rule simply no-ops', function() {
      var p = new Property('wat');
      p.addValidator();

      expect( p.validators() ).to.have.length( 0 );
    });

    it('applies a custom error message if passed', function() {
      var p = new Property('wat');
      p.addValidator( demoValid, 'boo fail' );
      expect( p.validators()[0].msg ).to.equal( 'boo fail' );
    });

    it('.validators(arr) applies an array of validators', function() {
      var watCheck = function(v) { return v === 'wat'; };
      var p = new Property('wat').validators([
        {rule:demoValid, errorMsg:'Text is not demo :('},
        {rule:watCheck, errorMsg:'Not wat :O'}
      ]);

      expect( p.validators() ).to.have.length( 2 );
    });

    it('.applyValidators() runs validators and returns errors', function(){
      var p = new Property('wat');
      p.addValidator( demoValid );
      var errs = p.validate( 'fail' );
      expect( errs ).to.be.an.instanceof( Array );
      expect( errs ).to.have.length( 1 );
      expect( errs[0] ).to.match( /Validation failed/ );
    });

    it('.applyValidators() returns empty array if validators pass', function() {
      var p = new Property('wat');
      p.addValidator( demoValid );
      expect( p.validate( 'demo' ) ).to.have.length( 0 );
    });

    it('no-ops adding same validator again (can only add a validator once)', function() {
      var p = new Property('wat');
      p.addValidator( demoValid );
      expect( p.validators() ).have.length( 1 );
      // Should not spaz out trying to add this again
      p.addValidator( demoValid );
      expect( p.validators() ).to.have.length( 1 );
    });

    it('.validate(val) requires a value to be passed', function() {
      var p = new Property('wat').addValidator( demoValid );
      var err;
      try { p.validate(); }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /validate.*requires/ );
    });

    it('.validate(val) executes validation rules and returns Array of errors', function() {
      var p = new Property('wat');
      p.addValidator( demoValid, 'Value is not `demo`');
      p.addValidator( function(v) { return v.length < 3 ? true : false; }, 'String too long' );

      var errs = p.validate('smoo');
      expect( errs ).to.be.an.instanceof( Array );
      expect( errs ).to.have.length( 2 );
    });

    it('.validate(val) returns empty array if no errors', function() {
      var p = new Property('wat');
      p.addValidator( demoValid );
      expect( p.validate('demo') ).to.have.length( 0 );
    });

    it('.validators adds args to rule stack as (limits, args, conditions)', function() {
      var p = new Property('!');
      p.validators([{rule:function(){}, limits:[1]}]);
      expect( p.rules[0].args[0] ).to.equal( 1 );
      p.validators([{rule:function(){}, args:[2]}]);
      expect( p.rules[1].args[0] ).to.equal( 2 );
      p.validators([{rule:function(){}, args:[3]}]);
      expect( p.rules[2].args[0] ).to.equal( 3 );
    });

    it('.validators packs a single limits:value as an array', function() {
      var p = new Property('!');
      p.validators([{rule:function(){}, limits:1}]);
      expect( p.rules[0].args[0] ).to.equal( 1 );
    });

    it('.validate() passes any declared limts to rule', function( done ) {

      var p = new Property( '!' );

      var v = {
        rule: function(v, a, b){
          expect( v ).to.equal( 'woo' );
          expect( a ).to.equal( 10 );
          expect( b ).to.equal( 'yes' );
          done();
          return v;
        },
        errorMsg:'Suck it',
        limits:[10,'yes']
      };

      p.validators( [v] );
      p.validate( 'woo' );

    });

  });



});
