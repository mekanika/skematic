var expect = require('chai').expect
  , Skematic = require('../index')
  , TypeConvert = require('../lib/typeconvert');

describe('Transform', function () {

  describe('apply', function () {
    it('no-ops if no transform provided', function () {
      expect( Skematic.transform('x') ).to.equal( 'x' );
    });

    it('applies a single string transform', function () {
      expect( Skematic.transform(' ! ', 'trim') ).to.equal( '!' );
    });

    it('applies array of transform keys', function () {
      expect( Skematic.transform(' ! ', ['trim']) ).to.equal( '!' );
    });

    it('ignores unknown transform types', function () {
      expect( Skematic.transform(' ! ', ['hodown']) ).to.equal( ' ! ' );
    });

    it('throws if a transform cannot apply', function () {
      var err;
      try { Skematic.transform( NaN, ['trim'] ); }
      catch (e) { err = e; }
      expect( err ).to.be.an.instanceof( Error );
    });
  });

  it('skips transforming on `undefined` values', function () {
    expect( Skematic.transform(undefined, 'toNumber') ).to.equal( undefined );
  });

  it('.available() provides list of available transform', function () {
    expect( Skematic.transform.available() ).to.have.length.gt( 0 );
  });

  it('.add(key,fn) adds a transform to be used', function () {
    var len = Skematic.transform.available().length;
    Skematic.transform.add('go', function(v){ return v+'go!';} );
    expect( Skematic.transform( '!', ['go'] ) ).to.equal( '!go!' );
    expect( Skematic.transform.available().length ).to.equal( len + 1 );
  });

  it('to$Type available transform [see typeconvert tests]', function () {
    var keys = Object.keys( TypeConvert );
    keys.forEach( function (key) {
      if (key.substr(0,2) === 'to')
        expect( Skematic.transform.available().indexOf(key) ).to.be.gt(-1);
    });
  });

  describe('method', function () {
    it('"trim" strings', function () {
      expect( Skematic.transform( ' ! .. 2 ', ['trim']) ).to.equal( '! .. 2' );
    });

    it('"uppercase" strings', function () {
      expect( Skematic.transform( 'abc', ['uppercase']) ).to.equal( 'ABC' );
    });

    it('"lowercase" strings', function () {
      expect( Skematic.transform( 'AbC', ['lowercase']) ).to.equal( 'abc' );
    });

    it('"nowhite" removes whitespace from strings', function () {
      expect( Skematic.transform(' c o  o  l  ', ['nowhite']) ).to.equal('cool');
    });
  });

});
