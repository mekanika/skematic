
var expect = require('chai').expect
  , Skematic = require('../index')
  , format = require('../lib/format');


describe('.format(skm, opts, data)', function () {

  // Load in the library of functions
  before( function () {
    Skematic.useGenerators({
      xx:function () {return 'wow';},
      dbl: function (x) { return x * 2; }
    });
  });

  after( function () {
    // Empty out the library
    Skematic.useGenerators({});
  });

  it('supports passing 2 args (schema, data)', function () {
    var s = {name:{default:'ace'}, power:{default:3}};
    var out = format( s, {} );
    expect( out.name ).to.equal('ace');
    expect( out.power ).to.equal(3);
  });

  it('can format scalar values', function () {
    var s = {default:'smoo'};

    var out = format(s, {}, '');
    expect(out).to.equal('smoo');
  });

  it('`sparse` opt defaults to false', function () {
    var s = {name:{default:'ace'}, power:{default:3}};
    var out = format( s, {}, {} );
    expect( out.name ).to.equal('ace');
    expect( out.power ).to.equal(3);
  });

  it('`sparse` opt "true" only parses provided data', function () {
    var s = {name:{default:'ace'}, power:{default:3}};
    var out = format( s, {sparse:true}, {power:undefined} );
    expect( out.power ).to.equal(3);
    expect( out ).to.have.keys( 'power' );
  });

  it('`defaults` opt default sets the default values :O', function () {
    var s = {name:{default:'ace'}};
    var out = format( s, {}, {} );
    expect( out.name ).to.equal('ace');
  });

  it('applies falsey defaults', function () {
    expect( format({default:false}, undefined) ).to.equal(false);
  });

  it('`transform` opt default transforms values', function () {
    var s = {name:{default:'ace', transforms:['uppercase']}};
    var out = format( s, {}, {} );
    expect( out.name ).to.equal('ACE');
  });

  it('`transform` opt "false" does not apply transforms', function () {
    var s = {name:{default:'ace', transforms:['uppercase']}};
    var out = format( s, {transform:false}, {} );
    expect( out.name ).to.equal('ace');
  });

  it('`generate` opt default computes generator values', function () {
    var s = {
      name:{
        generate: {
          ops:[{fn:'xx'}]
        }
      }
    };

    var out = format( s, {}, {} );
    expect( out.name ).to.equal('wow');
  });

  it('`generate` opt can run "once" flags for computed', function () {
    var s = {
      name:{
        generate: {
          ops:[{fn:'xx'}],
          // NOTE THIS: we're setting name to only generate with "once" flag
          once: true
        }
      }
    };

    var out = format( s, {}, {});
    expect( out ).to.not.have.key('name');

    out = format( s, {generate:'once'}, {});
    expect( out.name ).to.equal('wow');
  });

  it('`generate` opt "false" does not run generators', function () {
    var s = {
      name:{
        generate: { ops:[{fn:'xx'}] }
      }
    };

    var out = format(s, {generate:false}, {});
    expect( out ).to.not.have.key('name');
  });

  it('`strip` removes matching field values', function () {
    var data = {a:undefined, b:null, c:2, d:':)'};
    var out = format( {}, {strip:[undefined, null, ':)']}, data);
    expect( data ).to.eql( {c:2} );
  });

  it('`copy` clones the data to return', function () {
    var data = {a:undefined};
    var out = format( {a:{default:5}}, {copy:true}, data);
    expect( data.a ).to.equal( undefined );
    expect( out.a ).to.equal( 5 );

    data = [undefined];
    out = format( {type:'array', schema:{default:4}}, {copy:true}, data );
    expect( data[0] ).to.equal(undefined);
    expect( out[0] ).to.equal(4);
  });

  it('`mapIdFrom` maps the primaryKey from the id field', function () {
    var propSchema = {
      prop_id: {primaryKey:true},
      name: {type:"string"}
    };

    var data = [ {_id:"512314", name:"power"}, {_id:"519910", name:"speed"} ];

    var out = Skematic.format( propSchema, {mapIdFrom:'_id'}, data );
    expect( out ).to.have.length(2);
    expect( out[0] ).to.include.key( 'prop_id' );
    expect( out[0] ).to.not.include.key( '_id' );
  });

  it('`strict` strips fields not declared on schema', function () {
    var scm = {
      name:{type:'string'},
      tags:{type:'array', schema:{label:{}}}
    };
    var data = {woot:'1', name:'yo', tags:[{whatever:1, label:'moo'}]};

    var out = Skematic.format( scm, {strict:true}, data);
    expect( out ).to.have.keys( 'name', 'tags' );
    expect( out.tags[0] ).to.have.key( 'label' );
  });


  describe('$dynamic', function () {
    it('applies to all object keys', function () {
      var demo = {
        $dynamic: {default:'hello', required:true}
      };

      var out = format(demo, {a:undefined, b:null, c:''});
      expect( out.a ).to.equal('hello');
      expect( out.b ).to.equal('hello');
      expect( out.c ).to.equal('hello');
    });

    it('applies nested schema to objects', function () {
      var demo = {
        $dynamic: {type:'object', schema:{
          boom: {default:'!'}
        }}
      };
      var out = format(demo, {xo:{}});
      expect( out.xo.boom ).to.equal('!');
    });

    it('applies nested schema to arrays', function () {
      var demo = {
        $dynamic: {type:'array', schema:{
          boom:{default:'!', required:true}
        }}
      };
      var out = format(demo, {xo:[{}]});
      expect( out.xo[0].boom ).to.equal('!');
    });
  });

  describe('sub-schema', function () {

    it('applies format to embedded schema objects', function () {
      var s = {
        face: {default:'smoo'},
        person: {
          schema: {
            name: {default:'Zim'},
            age: {generate:{ops:[{fn:'dbl', args:[5]}]}},
            phrase: {transforms:['uppercase']}
          },
          // If no default specified, 'person' will only be applied
          // when a {person:{..}} field is provided
          default:{}
        }
      };

      var out = format(s, {});
      expect( out.person.name ).to.equal('Zim');
      expect( out.person.age ).to.equal( 10 );

      out = format(s, {}, {person:{phrase:'woo'}});
      expect( out.person.phrase ).to.equal('WOO');

    });

  });

  describe('arrays', function () {
    it('can array', function () {
      var s = {
        type:'array',
        schema: {
          default:'moo',
          generate: {ops:[{fn:'xx'}]},
          transforms: ['uppercase']
        },
        default: []
      };

      var out = format(s, {}, [undefined, 'hi']);
      expect( out ).to.have.length(2);
      expect( out[0] ).to.equal('WOW');

      out = format(s, {}, undefined);
      expect( out ).to.eql( [] );
    });

    it('support object field values as arrays', function () {
      var s = {
        zeep: {
          type:'array',
          schema: {
            default:'moo',
            generate: {ops:[{fn:'xx'}]},
            transforms: ['uppercase']
          },
          default: []
        },
        moo: {default:[]}
      };

      var out = format(s, {}, {zeep:[undefined], moo:[undefined]});
      expect( out.zeep[0] ).to.equal('WOW');
      expect( out.moo ).to.eql([undefined]);

      out = format(s,{}, {zeep:undefined});
      expect( out.zeep ).to.eql([]);
      expect( out.moo ).to.eql([]);
    });

    it('applies schema to objects in arrays', function () {
      var demo = {
        field: {type:'array', schema:{
          boom:{default:'!', required:true}
        }}
      };
      var out = format(demo, {field:[{}]});
      expect( out.field[0].boom ).to.equal('!');
    });
  });

});
