
var expect = require('chai').expect
  , Schema = require('../index');

describe('default', function () {

  it('returns the default value if no val provided', function () {
    expect( Schema.default( '', {default:'yes'})).to.equal('yes');
  });

  it('returns the passed value if provided', function () {
    expect( Schema.default('hi', {default:'yes'})).to.equal('hi');
  });

  it('handles falsey defaults', function () {
    expect( Schema.default('', {default:false})).to.equal(false);
  });

  it('returns the value if no .default', function () {
    expect( Schema.default( '' ) ).to.equal('');
    expect( Schema.default('hi') ).to.equal('hi');
  });

  it('can parse complex objects and return defaults', function () {
    var s = {
      name: {default:'Zim'},
      age: {type:'number'}
    };
    expect( Schema.default({age:21}, s).name ).to.equal('Zim');
  });

  it('ignores undefined values where no default specified', function () {
    var s = {moo: {type:'string'}};
    var o = Schema.default({},s);
    expect( o ).to.not.have.key('moo');
  });

});
