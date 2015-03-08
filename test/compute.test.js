
var expect = require('chai').expect
  , computeValue = require('../src/compute').computeValue
  , computeAll = require('../src/compute').computeAll;


describe('Computed value generator', function () {

  var fnLib = {
    'run': function () { return 'yes'; },
    'next':  function (arg) { return arg + ' no'; }
  };

  var sc = {name:{generate:{ops:{fn:'run'}}}};

  it('process a single value via .computeValue()', function () {
    expect( computeValue(sc.name.generate, fnLib) ).to.equal('yes');
  });

  it('throws if method to generate is not found in fnLib', function (done) {
    try {
      computeValue( sc.name.generate.ops, {} );
    }
    catch (e) { done(); }
  });

  it('returns the data object', function () {
    var o = {a:1};
    expect( computeAll(o) ).to.equal( o );
  });

  it('generates a value from a named function in schema def', function () {
    var s = {name: {
      generate:{ops:[{fn:'run'}]}}
    };

    expect( computeAll({}, s, fnLib).name ).to.equal('yes');
  });

  it('supports declaring a single fn in schema', function () {
    expect( computeAll({}, sc, fnLib).name ).to.equal('yes');
  });

  it('chains value as param into arrays of operator functions', function () {
    var s = {name: {
      generate:{ ops:[ {fn:'run'}, {fn:'next'}]}}
    };
    expect( computeAll({}, s, fnLib).name ).to.equal('yes no');
  });

  it('only updates a generated value if that value has changed', function () {
    var core = {};
    var val;
    var _set = 0;

    // Increment a counter everytime the 'name' property is set
    Object.defineProperty( core, 'name', {
      get: function () { return val; },
      set: function (v) {
        _set++;
        val = v;
      }
    });

    // Generate the initial value
    computeAll(core, sc, fnLib);
    // Check that the counter was incremented
    expect( _set ).to.equal( 1 );
    // Generate again, value is the same
    computeAll(core, sc, fnLib);
    // Check counter DID NOT get incremented again
    expect( _set ).to.equal( 1 );
  });

  it('resolves parameters provided as functions prior to passing', function () {
    var _get = function (p) {
      return 'hello '+p;
    };
    var s = {name: {
      generate:{ ops:[ {fn:'next', args:[ _get.bind(this,'world') ]}]}}
    };

    var res = computeAll({}, s, fnLib);

    expect( res.name ).to.equal('hello world no');
  });

  it('runs raw function ops', function () {
    var woo = function () { return 'woo!'; };
    var s = {jam: {generate:{ops:[woo]}}};

    var out = computeAll({}, s);
    expect( out.jam ).to.equal('woo!');
  });

});
