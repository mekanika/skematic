
var expect = require('chai').expect
  , Skematic = require('../lib/schema');


describe('API', function () {

  it('.format() exists', function () {
    expect( Skematic.format ).to.be.an.instanceof( Function );
  });

  it('exposes .compute method', function () {
    expect( Skematic.compute ).to.be.an.instanceof( Function );
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
