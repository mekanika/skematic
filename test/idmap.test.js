/*eslint-env node, mocha */
var expect = require('chai').expect,
  idMap = require('../lib/idmap');

describe('idMap()', function () {
  var propSchema = {
    prop_id: {primaryKey: true},
    name: {type: 'string'}
  };

  var data = [ {_id: '512314', name: 'power'}, {_id: '519910', name: 'speed'} ];

  it('transposes to a primaryKey field from an idField', function () {
    const out = idMap(propSchema, data.slice(), '_id')

    expect(out).to.have.length(2);
    expect(out[0]).to.include.key('prop_id');
    expect(out[0]).to.not.include.key('_id');

  });

  it('does nothing if no primaryKey defined', function () {
    var ps = {name: {type: 'string'}};
    var out = idMap(ps, data, '_id');

    expect(out).to.eql(data);
  });

  it('does nothing if primarKey field has a `generate` field', function () {
    var ps = {prop_id: {primaryKey: true, generate: {ops: [Math.random]}}};
    var out = idMap(ps, data, '_id');
    expect(out).to.eql(data);
  });

});
