
var expect = require('chai').expect
  , schema = require('../lib/schema');


describe('API', function () {

  it('exposes .compute method', function () {
    expect( schema.compute ).to.be.and.instanceof( Function );
  });

});

describe('createFrom', function () {

  var _s = { name:{default:'Gir'}, age:{}, power:{}};

  it('builds an object to match the schema keys', function () {
    expect( schema.createFrom(_s) ).to.have.keys('name','age','power');
  });

  it('sets intial object defaults', function () {
    expect( schema.createFrom(_s).name ).to.equal('Gir');
  });
});
