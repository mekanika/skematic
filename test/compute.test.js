
var expect = require('chai').expect
  , Schema = require('../src/schema')
  , computeValue = require('../src/compute').computeValue
  , computeAll = require('../src/compute').computeAll;


describe('Computed value generator', function () {

  var fnLib = {
    'run': function () { return 'yes'; },
    'next':  function (arg) { return arg + ' no'; }
  };

  var sc = {name:{generate:{ops:{fn:'run'}}}};

  beforeEach(function () {
    // Clear the library
    Schema.loadLib({});

    // Reload the library
    Schema.loadLib(fnLib);
  });

  it('can load in an object library of fns', function () {
    var s = {name: {
      generate:{ops:[{fn:'run'}]}}
    };
    // Clear the library
    Schema.loadLib({});
    // Load in the library
    Schema.loadLib(fnLib);
    expect( computeAll({}, s).name ).to.equal('yes');
  });

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


  describe('Flags', function () {

    var make = function (x) { return 'swee!' + (x ? x : ''); };

    it('default is generate all', function () {
      var s = {
        moo: {generate:{ops:[make]}}
      };

      var out = computeAll({}, s);
      expect( out.moo ).to.equal('swee!');
    });

    it('preserve:true keeps provided values', function () {
      var s = {
        moo: {generate:{ops:[make], preserve:true}}
      };

      var out = computeAll({moo:'moo!'}, s);
      expect( out.moo ).to.equal('moo!');
    });

    it('require:true', function () {
      var s = {
        moo: {generate:{ops:[make], require:true}},
        yep: {generate:{ops:[make], require:true, preserve:true}},
        woo: {generate:{ops:[make], require:true}}
      };

      var out = computeAll({moo:'!', yep:'woo!'}, s);

      expect( out.moo ).to.equal('swee!');
      expect( out.yep ).to.equal('woo!');
      expect( Object.keys(out) ).to.have.length(2);
    });

  });

});
