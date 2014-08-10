

var expect = require('chai').expect
  , Schema = require('../src/schema')
  , Cast = require('../src/cast')
  , schema = require('../src/_property');


describe('default', function () {

  it('returns the default value if no val provided', function () {
    expect( schema.default( '', {default:'yes'})).to.equal('yes');
  });

  it('returns the passed value if provided', function () {
    expect( schema.default('hi', {default:'yes'})).to.equal('hi');
  });

  it('returns the value if no Schema.default', function () {
    expect( schema.default( '' ) ).to.equal('');
    expect( schema.default('hi') ).to.equal('hi');
  });

});


describe('filters', function () {

  describe('apply', function () {
    it('no-ops if no filters provided', function () {
      expect( schema.filter('x') ).to.equal( 'x' );
    });

    it('applies a single string filter', function () {
      expect( schema.filter(' ! ', 'trim') ).to.equal( '!' );
    });

    it('applies array of filter keys', function () {
      expect( schema.filter(' ! ', ['trim']) ).to.equal( '!' );
    });

    it('ignores unknown filter types', function () {
      expect( schema.filter(' ! ', ['hodown']) ).to.equal( ' ! ' );
    });

    it('throws if a filter cannot apply', function () {
      var err;
      try { schema.filter( NaN, ['trim'] ); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
    });
  });

  it('.available provides list of available filters', function () {
    expect( schema.filter.available ).to.have.length.gt( 0 );
  });

  it('.add(key,fn) adds a filter to be used', function () {
    schema.filter.add('go', function(v){ return v+'go!';} );
    expect( schema.filter( '!', ['go'] ) ).to.equal( '!go!' );
  });

  it('to$Cast available filters [see cast tests]', function () {
    var keys = Object.keys( Cast );
    keys.forEach( function (key) {
      if (key.substr(0,2) === 'to')
        expect( schema.filter.available.indexOf(key) ).to.be.gt(-1);
    });
  });

  it('"trim" strings', function () {
    expect( schema.filter( ' ! .. 2 ', ['trim']) ).to.equal( '! .. 2' );
  });

  it('"uppercase" strings', function () {
    expect( schema.filter( 'abc', ['uppercase']) ).to.equal( 'ABC' );
  });

  it('"lowercase" strings', function () {
    expect( schema.filter( 'AbC', ['lowercase']) ).to.equal( 'abc' );
  });

});


describe('typeCheck(val, type)', function () {
  it('validates a value is of type returning array of errors', function () {
    expect( schema.typeCheck ).to.be.an.instanceof( Function );
    expect( schema.typeCheck('a', 'string') ).to.have.length( 0 );
  });

  it('returns error if type is unknown/undeclared', function () {
    expect( schema.typeCheck(1, 'WOOootss') ).to.have.length( 1 );
    expect( schema.typeCheck(1, 'WOOootss')[0] ).to.match( /unknown/ig );
  });

  describe('types', function () {
    it('string', function () {
      expect( schema.typeCheck('abc', 'string') ).to.have.length(0);
      expect( schema.typeCheck( 123, 'string')  ).to.have.length(1);
    });

    it('integer', function () {
      var i = 'integer';
      expect( schema.typeCheck('1', i) ).to.have.length(1);
      expect( schema.typeCheck(100, i) ).to.have.length(0);
      expect( schema.typeCheck(100.0, i) ).to.have.length(0);
      expect( schema.typeCheck(100.1, i) ).to.have.length(1);
      expect( schema.typeCheck(NaN, i) ).to.have.length(1);
    });

    it('array', function () {
      var ar = 'array';
      expect( schema.typeCheck([], ar) ).to.have.length(0);
      expect( schema.typeCheck([1,2,3], ar) ).to.have.length(0);
      expect( schema.typeCheck({}, ar) ).to.have.length(1);
      expect( schema.typeCheck({length:0}, ar) ).to.have.length(1);
      expect( schema.typeCheck(true, ar) ).to.have.length(1);
    });

    it('boolean', function () {
      var b = 'boolean';
      expect( schema.typeCheck(1, b) ).to.have.length(1);
      expect( schema.typeCheck(0, b) ).to.have.length(1);
      expect( schema.typeCheck('true', b) ).to.have.length(1);
      expect( schema.typeCheck(true, b) ).to.have.length(0);
      expect( schema.typeCheck(false, b) ).to.have.length(0);
    });

    it('should test number');

  });
});


describe('test(val, schema)', function () {
  it('returns an array of string errors', function () {
    expect( schema.test ).to.be.an.instanceof( Function );
    expect( schema.test('abc') ).to.have.length( 0 );
    expect( schema.test( 1, {type:'string'} ) ).to.have.length(1);
    expect( schema.test( 1, {type:'string'} )[0] ).to.be.a( 'string' );
  });

  it('returns empty array if no schema provided', function () {
    expect( schema.test('abc') ).to.have.length( 0 );
  });

  it('applies default value first', function () {
    var s = {
      default: 'zim',
      rules: {in:['zim']}
    };

    // The rule tests that the value is 'zim'. Only true if default is applied.
    expect( schema.test('', s) ).to.have.length( 0 );
  });

  it('applies filters after default and prior to rule check', function () {
    var s = {default:' zim ', filters:['trim'], rules:{in:['zim']}};
    expect( schema.test( '', s) ).to.have.length( 0 );
  });

  it('then checks that required values are set', function () {
    var s = {required:true, filters:['trim'], rules:{in:['x']}};
    expect( schema.test('', s) ).to.have.length(1);
    expect( schema.test('', s)[0] ).to.match( /required/ig );

    // Now check sequencing (required should pass because default was set)
    s = {required:true, default:' zim ', filters:['trim'], rules:{in:['zim']}};
    expect( schema.test( '', s) ).to.have.length( 0 );
  });

  it('then checks type matches', function () {
    var fail = {type:'integer'};
    var pass = {type:'integer', filters:['toInteger']};
    expect( schema.test( '1', fail) ).to.have.length( 1 );
    expect( schema.test( '1', pass) ).to.have.length( 0 );
  });

  it('then applies specified rules', function () {
    var s = {type:'integer', rules:{min:5}};
    expect( schema.test(1, s) ).to.have.length(1);
    expect( schema.test(1, s) ).to.match( /min/ig );
  });

  it('adds error if rule is unknown/undeclared', function () {
    var s = {type:'integer', rules:{'attack':true}};
    expect( schema.test(1, s) ).to.have.length(1);
    expect( schema.test(1, s) ).to.match( /unknown/ig );
  });

  describe('error msgs', function () {
    it('can be set declaritively', function () {
      var s = {rules:{in:['a']}, errors:{in:'Hotdog!'}};
      expect( schema.test('b', s)[0] ).to.equal('Hotdog!');
    });

    it('can set default error message for schema', function () {
      var s = {rules:{in:['a']}, errors:{default:'Hotdog!'}};
      expect( schema.test('b', s)[0] ).to.equal('Hotdog!');
    });

    it('can set default msg as string', function () {
      var s = {rules:{in:['a']}, errors:'Hotdog!'};
      expect( schema.test('b', s)[0] ).to.equal('Hotdog!');
    });

    it('uses system default msg if no match', function () {
      var s = {rules:{in:['a']}, errors:{}};

      // @note This is HARDCODED to match the 'defaultError'
      expect( schema.test('b', s) ).to.match( /failed/ig );
    });
  });

});


describe('Validate', function () {
  it('throws on invalid schema', function (done) {
    var s = {name:{type:true}};
    try {
      schema.validate( {name:'dib'}, s );
    }
    catch (e) {
      expect( e.message ).to.match( /invalid/ig );
      done();
    }
  });

  it('returns {data, valid, errors} object', function () {
    var record = {name:'Jack'};
    var s = { name: {type:'string'} };
    var res = schema.validate( record, s );
    expect( res ).to.have.keys( 'data', 'valid', 'errors' );
  });

  it('casts/filters the values in `data` on valid', function () {
    var record = {power:'40'};
    var s = { power:{type:'integer' } };

    expect( schema.validate( record, s ).data.power ).to.equal('40');

    s.power.default = '50';
    s.power.filters = ['toInteger'];
    var res = schema.validate( {power:''}, s );
    expect( res.data.power ).to.equal( 50 );
  });

  it('provides error arrays keyed to properties', function () {
    var res = schema.validate({power:'1'}, {power:{type:'integer'}});
    expect( res.errors ).to.have.keys( 'power' );
    expect( res.errors.power ).to.have.length.gt( 0 );
  });

  it('sets .valid boolean based on validation result', function () {
    var res = schema.validate({power:'1'}, {power:{type:'integer'}});
    expect( res.valid ).to.be.false;

    res = schema.validate({power:1}, {power:{type:'integer'}});
    expect( res.valid ).to.be.true;
  });

  it('whitelists properties on cast (discards unknowns)', function () {
    var s = {power:{type:'integer'}};
    var data = {power:3, jack:'jill'};
    var res = schema.validate( data, s );
    expect( res.data ).to.have.keys( 'power' );
  });


  describe('subschema', function () {

    describe('string reference', function () {

      it('accessor throws if not overwritten', function () {
        var err;
        try { schema.validate({go:'boo'}, {go:{schema:'yo'}}); }
        catch (e) { err = e; }
        expect( err ).to.be.an.instanceof( Error );
      })

      it('accessor can return working schema', function () {
        var hero = {name:{type:'string'}, power:{type:'integer'}};
        schema.accessor = function () { return hero; };
        var s = {group:{type:'array', schema:'hero'}};
        var res = schema.validate( {group: [{name:'gir', power:'3'}]}, s );
        expect( res.valid ).to.be.false;
        expect( res.errors.group[0].power ).to.have.length(1);
      });

    });

    describe('objects', function () {
      it('can validate complex subschema', function () {
        var s = { bigsub: {schema:{
          top:{type:'integer'},
          cool:{type:'string'}}
        }};

        var res = schema.validate({bigsub:{top:'s'}}, s );
        expect( res.errors ).to.have.keys( 'bigsub' );
        expect( res.errors.bigsub.top ).to.have.length( 1 );

        s.bigsub.schema.top.filters = ['toInteger'];
        res = schema.validate({bigsub:{top:'11'}}, s );
        expect( res.valid ).to.be.true;
        expect( res.data.bigsub.top ).to.equal( 11 );
      });

      it('can recursively validate', function () {

        var s = {
          name: {type:'string'},
          address: { schema: {
            street: {schema: {
              number: {type:'integer', required:true},
              name: {type:'string', rules:{maxLength:5}}
            }},
            city: {type:'string', required:true},
            zipcode: {type:'integer', required:true}
          }},
          tags: { type:'array', schema:{type:'string'} },
          books: {type:'array', schema:{
            title:{type:'string'},
            author: {type:'string'}
          }}
        };

        var data = {
          name:'zim',
          address: {
            street:{number:4},
            city:'mrrn',
            zipcode:5151},
          tags: ['hello', '20'],
          books: [{title:'WOT', author:'RJ'}, {title:'GOT', author:555}]
        };

        // Demonstrate error validation
        var res = schema.validate( data, s );
        expect( res.valid ).to.be.false;
        expect( res.errors.books['1'].author ).to.have.length( 1 );

        // Demonstrate PASSING
        s.books.schema.author.filters = ['toString'];
        res = schema.validate( data, s );
        expect( res.valid ).to.be.true;
        expect( res.data.books[1].author ).to.equal('555');
      });
    });

    describe('arrays', function () {
      it('index errors', function () {
        var s = {gir:{schema:{type:'string'}}};
        var res = schema.validate( {gir:['a','b',4]}, s );

        expect( res.valid ).to.be.false;
        // The 3rd element should have an error `arr['2']`
        expect( res.errors.gir ).to.have.key('2');
      });

      it('detects array values without declaring type:array', function () {
        var s = {gir:{schema:{type:'string', filters:['toString']}}};
        var res = schema.validate( {gir:['a','b',4]}, s );
        expect( res.valid ).to.be.true;
        s.gir.type = 'array';
        res = schema.validate( {gir:['a','b',4]}, s );
        expect( res.valid ).to.be.true;
      });

      it('of simple (primitive) types', function () {
        var s = {gir:{type:'array', schema:{type:'string', filters:['toString']}}};
        var res = schema.validate( {gir:['a','b',4]}, s );

        expect( res.valid ).to.be.true;
      });

      it('of complex objects/models', function () {
        var s = {
          gir: {schema:{
            age:{type:'integer'},
            says:{type:'string'}
          }}
        };

        var res = schema.validate({gir:[{age:2, says:'hi'},{age:4,says:1337}]}, s);
        expect( res.valid ).to.be.false;
        expect( res.errors.gir['1'].says ).to.have.length(1);
      });
    });

  });

});

