

var expect = require('chai').expect
  , Schema = require('../src/schema')
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

