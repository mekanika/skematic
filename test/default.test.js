
var expect = require('chai').expect
  , Skematic = require('../index');

describe('default', function () {

  it('returns the default value if no val provided', function () {
    expect( Skematic.default( '', {default:'yes'})).to.equal('yes');
  });

  it('returns the passed value if provided', function () {
    expect( Skematic.default('hi', {default:'yes'})).to.equal('hi');
  });

  it('handles falsey defaults', function () {
    expect( Skematic.default('', {default:false})).to.equal(false);
  });

  it('returns the value if no .default', function () {
    expect( Skematic.default( '' ) ).to.equal('');
    expect( Skematic.default('hi') ).to.equal('hi');
  });

  it('can parse complex objects and return defaults', function () {
    var s = {
      name: {default:'Zim'},
      age: {type:'number'}
    };
    expect( Skematic.default({age:21}, s).name ).to.equal('Zim');
  });

  it('ignores undefined values where no default specified', function () {
    var s = {moo: {type:'string'}};
    var o = Skematic.default({},s);
    expect( o ).to.not.have.key('moo');
  });

});
