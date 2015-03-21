
var expect = require('chai').expect
  , Skematic = require('../index')
  , format = require('../lib/format');


describe('.format(skm, opts, data)', function () {

  // Load in the library of functions
  before( function () {
    Skematic.loadLib({
      xx:function () {return 'wow';},
      dbl: function (x) { return x * 2; }
    });
  });

  after( function () {
    // Empty out the library
    Skematic.loadLib({});
  });

  it('supports passing 2 args (schema, data)', function () {
    var s = {name:{default:'ace'}, power:{default:3}};
    var out = format( s, {} );
    expect( out.name ).to.equal('ace');
    expect( out.power ).to.equal(3);
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

  describe('sub-schema', function () {

    it('applies format to embedded schema objects', function () {
      var s = {
        face: {default:'smoo'},
        person: {
          schema: {
            name: {default:'Zim'},
            age: {generate:{ops:[{fn:'dbl', args:[5]}]}},
            phrase: {transforms:['uppercase']}
          }
        }
      };

      var out = format(s, {}, {});
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
  });

  describe('scalar', function () {
    it('should basds', function () {
      var s = {default:'smoo'};

      var out = format(s, {}, '');
      console.log('out', out);
    });
  });

});
