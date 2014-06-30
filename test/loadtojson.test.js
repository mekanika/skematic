
/*
 * Test dependencies
 */

var expect = require('chai').expect
  , schema = require('../index')
  , schemaToJSON = require('../tools/toJSON');


describe('Statics', function() {


  describe('schemaToJSON convertor', function () {

    // Setup a basic schema to test loadout
    var $ = schema.new('^_^')
        .prop('smoo')
        .prop('hooobooy', {default:true})
        .method('axe', function() { return 200; });

    it('exports schema as JSON (with functions)', function () {
      var asJson = schemaToJSON( $ );
      expect( typeof asJson ).to.equal( 'string' );

      // Demonstrate that JSON.stringify strips "fn()"s
      var jre = JSON.parse( JSON.stringify( $ ) );
      expect( jre.methods[0].fn ).to.equal( undefined );

      // Now show that .toJSON does NOT strip the functions
      // NOTE: JSON.parse does not parse "function()" strings as `Function`s
      var re = JSON.parse( asJson );
      expect( typeof re.methods[0].fn ).to.equal( 'string' );
    });

    it('serialises property validator functions', function () {
      var r = schema.new('Ruler').prop('king', {required:true});
      // Ensure the 'required' rule is present
      expect( r.properties[0].rules.length ).to.equal( 1 );

      // Convert to a string, then reimport as `reloaded`
      var str = schemaToJSON( r );
      schema.unload('Ruler');
      var reloaded = schema.load( str );

      // Check the 'rule' is properly converted to a function
      var vx = reloaded.properties[0].rules[0];
      expect( vx ).to.have.keys( 'rule', 'msg', 'args' );
      expect( vx.rule ).to.be.a( 'function' );
    });

    it('serialises setter and getter property functions', function () {
      var r = schema('Ruler').prop('king');

      // Apply getters and setters
      r.path('king')
        .set( function(v){ return v+1;} )
        .get( function(v){ return v-1; } );

      var str = schemaToJSON( r );
      schema.unload('Ruler');
      var reloaded = schema.load( str );

      var setr = reloaded.properties[0].setters[0];
      var getr = reloaded.properties[0].getters[0];

      expect( setr ).to.be.a( 'function' );
      expect( getr ).to.be.a( 'function' );
      expect( setr( 5 ) ).to.equal( 6 );
      expect( getr( 5 ) ).to.equal( 4 );
    });

  });


  describe('schema.load()', function() {

    var rock = schema.new('Rock')
      .prop('name')
      .prop('age', {type:'number'})
      .method('jam', function(x) { return 'doing '+x; });

    var rockjson = schemaToJSON( rock );

    var bluesobj = schema.new('Blues')
      .prop('cool', {type:'boolean'})
      .prop('style')
      .method('slick', function (x) { return 'slick '+x; });

    beforeEach( function() { schema.reset(); } );

    it('throws if not provided an object or JSON object string', function() {
      var err;
      try {
        schema.load( 123 );
      }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );

      err = null;
      try { schema.load( "hello" ); }
      catch ( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
    });

    it('converts a JSON string into JS object', function() {
      var O_o = schema.load( rockjson );
      expect( O_o ).to.equal( schema('Rock') );
    });

    it('returns a Schema#', function() {
      var O_o = schema.load( {} );
      expect( O_o ).to.be.an.instanceof( schema.Schema );
    });

    it('generates a schema key if none provided', function() {
      var O_o = schema.load( {} );
      expect( typeof O_o.identity ).to.equal( 'string' );
      expect( O_o.identity.length ).to.be.above( 5 );
    });

    it('applies complex properties {key:{Object}} (JSON + obj)', function() {
      var O_o = schema.load( schemaToJSON( bluesobj ) );
      expect( O_o.path('cool').type ).to.equal( 'boolean' );

      O_o = schema.load( rockjson );
      expect( O_o.path('age').type ).to.equal( 'number' );
    });

    it('method conversion to string fails/throws sanely', function() {
      err = null;
      try { schema.load( '{"methods":[{"wat":"function()..."}]}' ); }
      catch( e ) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
      expect( err.message ).to.match( /convert.*string/ );
    });

    it('applies methods (with arguments) to schema (JSON + obj) ', function() {
      var O_o = schema.load( rockjson );
      expect( O_o.methods ).to.have.length( 1 );
      expect( O_o.methods[0].key ).to.equal( 'jam' );
      expect( O_o.methods[0].fn('^_^') ).to.equal( 'doing ^_^' );
    });

    it.skip('exports, imports and exports to identical strings', function () {
      var reimport = schemaToJSON( schema.load( rockjson ) );

      // @NOTE @todo The current reinstantiation of Functions generates
      // new functions that are named as "anonymous", eg. `function anonymous()`
      // Need to dig into how to name them as nothing OR name them on the way
      // out when they're being exported.
      console.log( reimport );
      console.log( rockjson );
      expect( reimport ).to.equal( rockjson );
    });

  });

});
