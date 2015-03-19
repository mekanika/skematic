
var expect = require('chai').expect
  , schema = require('../index');

describe('Validate', function () {
  it('exposes .validSchema', function () {
    expect( schema.validSchema ).to.exist;
  });

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

  it('returns {valid, errors} object', function () {
    var record = {name:'Jack'};
    var s = { name: {type:'string'} };
    var res = schema.validate( record, s );
    expect( res ).to.have.keys( 'valid', 'errors' );
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

  it('validates scalars {validBool, errorArray!}', function () {
    var s = {type:'string', rules:{maxLength:3}};

    expect( schema.validate('123', s).valid ).to.equal(true);
    expect( schema.validate('1234', s).valid ).to.equal(false);
    expect ( schema.validate('1234', s).errors ).to.be.an.instanceof( Array );
  });

  describe('subschema', function () {

    describe('string reference', function () {

      it('accessor throws if not overwritten', function () {
        var err;
        try { schema.validate({go:'boo'}, {go:{schema:'yo'}}); }
        catch (e) { err = e; }
        expect( err ).to.be.an.instanceof( Error );
      });

      it('sets accessor by passing a function', function () {
        var tmp = schema.accessor;
        var rep = function() { return 'woo!'; };
        schema.accessor(rep);
        expect( schema.accessor() ).to.equal('woo!');
        // Replace the accessor method
        schema.accessor(tmp);
      });

      it('accessor can return working schema', function () {
        var hero = {name:{type:'string'}, power:{type:'integer'}};
        schema.accessor( function () { return hero; } );
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
        expect( res.errors.bigsub.top[0] ).to.match(/integer/);
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

        var data = {gir:['a','b','4']};

        var res = schema.validate( data, s );
        expect( res.valid ).to.be.true;
        s.gir.type = 'array';
        res = schema.validate( data, s );
        expect( res.valid ).to.be.true;
      });

      it('of simple (primitive) types', function () {
        var s = {gir:{type:'array', schema:{type:'string', filters:['toString']}}};
        var res = schema.validate( {gir:['a','b','4']}, s );

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

      it('skips undefined arrays that have a schema AND a default', function () {
        var rec = {mega:'kool'};
        var s = {jam:{type:'array', default:['moo'], schema:{type:'string'}}};
        var res = schema.validate( rec, s );
        expect( res.valid ).to.be.ok;
      });
    });

  });
});


describe('checkValue(val, schema)', function () {
  it('returns an array of string errors', function () {
    expect( schema.checkValue ).to.be.an.instanceof( Function );
    expect( schema.checkValue('abc') ).to.have.length( 0 );
    expect( schema.checkValue( 1, {type:'string'} ) ).to.have.length(1);
    expect( schema.checkValue( 1, {type:'string'} )[0] ).to.be.a( 'string' );
  });

  it('returns empty array if no schema provided', function () {
    expect( schema.checkValue('abc') ).to.have.length( 0 );
  });

  it('then checks that required values are set', function () {
    var s = {required:true, rules:{in:['x']}};
    var res = schema.checkValue('', s);
    expect( schema.checkValue('', s) ).to.have.length(1);
    expect( schema.checkValue('', s)[0] ).to.match( /required/ig );

    // Now check the affirmative case
    s = {required:true, default:'zim', rules:{in:['zim']}};
    expect( schema.checkValue( 'zim', s) ).to.have.length( 0 );
  });

  it('returns unrequired undefined values', function () {
    expect( schema.checkValue(undefined, {rules:{min:0}}) ).to.have.length(0);
  });

  it('then checks type matches', function () {
    var s = {type:'integer', transforms:['toInteger']};

    var data = '1';
    expect( schema.checkValue( data, s) ).to.have.length( 1 );

    data = schema.cast(data, s);
    expect( schema.checkValue( data, s) ).to.have.length( 0 );
  });

  it('then applies specified rules', function () {
    var s = {type:'integer', rules:{min:5}};
    expect( schema.checkValue(1, s) ).to.have.length(1);
    expect( schema.checkValue(1, s) ).to.match( /min/ig );
  });

  it('adds error if rule is unknown/undeclared', function () {
    var s = {type:'integer', rules:{'attack':true}};
    expect( schema.checkValue(1, s) ).to.have.length(1);
    expect( schema.checkValue(1, s) ).to.match( /unknown/ig );
  });

  describe('error msgs', function () {
    it('can be set declaritively', function () {
      var s = {rules:{in:['a']}, errors:{in:'Hotdog!'}};
      expect( schema.checkValue('b', s)[0] ).to.equal('Hotdog!');
    });

    it('can set default error message for schema', function () {
      var s = {rules:{in:['a']}, errors:{default:'Hotdog!'}};
      expect( schema.checkValue('b', s)[0] ).to.equal('Hotdog!');
    });

    it('can set default msg as string', function () {
      var s = {rules:{in:['a']}, errors:'Hotdog!'};
      expect( schema.checkValue('b', s)[0] ).to.equal('Hotdog!');
    });

    it('uses system default msg if no match', function () {
      var s = {rules:{in:['a']}, errors:{}};

      // @note This is HARDCODED to match the 'defaultError'
      expect( schema.checkValue('b', s) ).to.match( /failed/ig );
    });
  });
});


describe('sparseValidate', function () {
  it('only validates data object fields (not schema)', function () {
    var rec = {mega:'kool'};
    var s = {mega:{type:'string'}, cray:{required:true}};

    var res = schema.sparseValidate(rec, s);
    expect( res.valid ).to.equal( true );
  });
});
