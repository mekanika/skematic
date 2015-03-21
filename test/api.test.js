
var expect = require('chai').expect
  , Skematic = require('../index');


describe('API', function () {

  var apiMethods = [
    'useSchemas',
    'createFrom',
    'format',
    'loadLib',
    'validate'
  ];

  // This loops through all the EXPECTED methods to be exposed on the API .
  // Modify the array above `apiMethods` to add and remove from the API surface.
  apiMethods.forEach( function (method) {

    it('.'+method+'() exists', function () {
      expect( Skematic[method] ).to.be.an.instanceof( Function );
    });

  });

});

describe('Lookup Schema by string reference', function () {
  it('throws if ref not found', function (done) {
    var s = { jam:{schema:'woo'} };
    try {
      Skematic.validate( s, {jam:1} );
    }
    catch (e) {
      expect( e.message ).to.match( /woo/ig );
      done();
    }
  });

  it('loads in a schemas reference', function () {
    var s = { jam:{schema:'woo'} };
    Skematic.useSchemas({woo:{type:'string'}});
    var out = Skematic.validate( s, {jam:1});
    expect( out.valid ).to.equal(false);
  });
});

describe('createFrom', function () {

  var _s = { name:{default:'Gir'}, age:{}, power:{}};

  it('builds an object to match the Skematic keys', function () {
    expect( Skematic.createFrom(_s) ).to.have.keys('name','age','power');
  });

  it('sets intial object defaults', function () {
    expect( Skematic.createFrom(_s).name ).to.equal('Gir');
  });

  it('runs .format() to execute generators', function () {
    var go = function () { return 'woo!'; };
    var s = {shout:{generate:{ops:[go]}}};
    expect( Skematic.createFrom(s) ).to.eql( {shout:'woo!'} );
  });
});
