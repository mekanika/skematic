var expect = require('chai').expect
  , Schema = require('../index')
  , TypeConvert = require('../lib/typeconvert');

describe('filters', function () {

  describe('apply', function () {
    it('no-ops if no filters provided', function () {
      expect( Schema.filter('x') ).to.equal( 'x' );
    });

    it('applies a single string filter', function () {
      expect( Schema.filter(' ! ', 'trim') ).to.equal( '!' );
    });

    it('applies array of filter keys', function () {
      expect( Schema.filter(' ! ', ['trim']) ).to.equal( '!' );
    });

    it('ignores unknown filter types', function () {
      expect( Schema.filter(' ! ', ['hodown']) ).to.equal( ' ! ' );
    });

    it('throws if a filter cannot apply', function () {
      var err;
      try { Schema.filter( NaN, ['trim'] ); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
    });
  });

  it('skips filtering on `undefined` values', function () {
    expect( Schema.filter(undefined, 'toNumber') ).to.equal( undefined );
  });

  it('.available() provides list of available filters', function () {
    expect( Schema.filter.available() ).to.have.length.gt( 0 );
  });

  it('.add(key,fn) adds a filter to be used', function () {
    var len = Schema.filter.available().length;
    Schema.filter.add('go', function(v){ return v+'go!';} );
    expect( Schema.filter( '!', ['go'] ) ).to.equal( '!go!' );
    expect( Schema.filter.available().length ).to.equal( len + 1 );
  });

  it('to$Type available filters [see typeconvert tests]', function () {
    var keys = Object.keys( TypeConvert );
    keys.forEach( function (key) {
      if (key.substr(0,2) === 'to')
        expect( Schema.filter.available().indexOf(key) ).to.be.gt(-1);
    });
  });

  describe('method', function () {
    it('"trim" strings', function () {
      expect( Schema.filter( ' ! .. 2 ', ['trim']) ).to.equal( '! .. 2' );
    });

    it('"uppercase" strings', function () {
      expect( Schema.filter( 'abc', ['uppercase']) ).to.equal( 'ABC' );
    });

    it('"lowercase" strings', function () {
      expect( Schema.filter( 'AbC', ['lowercase']) ).to.equal( 'abc' );
    });

    it('"nowhite" removes whitespace from strings', function () {
      expect( Schema.filter(' c o  o  l  ', ['nowhite']) ).to.equal('cool');
    });
  });

});
