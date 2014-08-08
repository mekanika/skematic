

var expect = require('chai').expect
  , Schema = require('../src/schema')
  , Cast = require('../src/cast')
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


describe('filters', function () {

  describe('apply', function () {
    it('applies array of filter keys', function () {
      expect( schema.filter(' ! ', ['trim']) ).to.equal( '!' );
    });

    it('ignores unknown filter types', function () {
      expect( schema.filter(' ! ', ['hodown']) ).to.equal( ' ! ' );
    });

    it('throws if a filter cannot apply', function () {
      var err;
      try { schema.filter( NaN, ['trim'] ); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
    });
  });

  it('.available provides list of available filters', function () {
    expect( schema.filter.available ).to.have.length.gt( 0 );
  });

  it('.add(key,fn) adds a filter to be used', function () {
    schema.filter.add('go', function(v){ return v+'go!';} );
    expect( schema.filter( '!', ['go'] ) ).to.equal( '!go!' );
  });

  it('to$Cast available filters [see cast tests]', function () {
    var keys = Object.keys( Cast );
    keys.forEach( function (key) {
      if (key.substr(0,2) === 'to')
        expect( schema.filter.available.indexOf(key) ).to.be.gt(-1);
    });
  });

  it('"trim" strings', function () {
    expect( schema.filter( ' ! .. 2 ', ['trim']) ).to.equal( '! .. 2' );
  });

  it('"uppercase" strings', function () {
    expect( schema.filter( 'abc', ['uppercase']) ).to.equal( 'ABC' );
  });

  it('"lowercase" strings', function () {
    expect( schema.filter( 'AbC', ['lowercase']) ).to.equal( 'abc' );
  });

});


describe('typeCheck(val, type)', function () {
  it('validates a value is of type returning array of errors', function () {
    expect( schema.typeCheck ).to.be.an.instanceof( Function );
    expect( schema.typeCheck('a', 'string') ).to.have.length( 0 );
  });

  describe('types', function () {
    it('string', function () {
      expect( schema.typeCheck('abc', 'string') ).to.have.length(0);
      expect( schema.typeCheck( 123, 'string')  ).to.have.length(1);
    });

    it('integer', function () {
      var i = 'integer';
      expect( schema.typeCheck('1', i) ).to.have.length(1);
      expect( schema.typeCheck(100, i) ).to.have.length(0);
      expect( schema.typeCheck(100.0, i) ).to.have.length(0);
      expect( schema.typeCheck(100.1, i) ).to.have.length(1);
      expect( schema.typeCheck(NaN, i) ).to.have.length(1);
    });;

    it('should test number');
    it('should test boolean');
    it('should test boolean');
  });
});

