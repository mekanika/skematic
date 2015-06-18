/*eslint-env node, mocha */
var expect = require('chai').expect,
  setDefault = require('../lib/default');

describe('default', function () {
  it('returns the default value if no val provided', function () {
    expect(setDefault('', {default: 'yes'})).to.equal('yes');
  });

  it('returns the passed value if provided', function () {
    expect(setDefault('hi', {default: 'yes'})).to.equal('hi');
  });

  it('handles falsey defaults', function () {
    expect(setDefault('', {default: false})).to.equal(false);
  });

  it('returns the value if no .default', function () {
    expect(setDefault('')).to.equal('');
    expect(setDefault('hi')).to.equal('hi');
  });

  it('can parse complex objects and return defaults', function () {
    var s = {
      name: {default: 'Zim'},
      age: {type: 'number'}
    };
    expect(setDefault({age: 21}, s).name).to.equal('Zim');
  });

  it('ignores undefined values where no default specified', function () {
    var s = {moo: {type: 'string'}};
    var o = setDefault({}, s);
    expect(o).to.not.have.key('moo');
  });

  it('applies default to falsey scalar', function () {
    expect(setDefault(undefined, {default: false})).to.equal(false);
  });

  it('applies default to falsey object', function () {
    expect(setDefault({a: ''}, {a: {default: false}})).to.eql({a: false});
  });

});
