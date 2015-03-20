
var expect = require('chai').expect
  , Skematic = require('../index');


describe('API', function () {

  var apiMethods = [
    'accessor',
    'createFrom',
    'format',
    'loadLib',
    'validate'
  ]

  // This loops through all the EXPECTED methods to be exposed on the API .
  // Modify the array above `apiMethods` to add and remove from the API surface.
  apiMethods.forEach( function (method) {

    it('.'+method+'() exists', function () {
      expect( Skematic[method] ).to.be.an.instanceof( Function );
    });

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
});
