/*eslint-env node, mocha */
var expect = require('chai').expect,
  strip = require('../lib/strip');

describe('.strip()', function () {
  it('removes fields whose values match', function () {
    var data = {a: undefined, b: 2};
    strip(undefined, data);
    expect(data).to.eql({b: 2});
  });

  it('allows passing arrays of `values`', function () {
    var data = {a: undefined, b: null, c: 2, d: ':)'};
    strip([undefined, null, ':)'], data);
    expect(data).to.eql({c: 2});
  });

});
