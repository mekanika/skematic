
var expect = require('chai').expect
  , Schema = require('../index');

describe('cast (default + filters)', function () {
  var s = {
    name: {type:'string', default:'zim'},
    address: { schema: {
      street: {schema: {
        number: {type:'integer', required:true, default:0},
        name: {type:'string', rules:{maxLength:5}}
      }},
      city: {type:'string', required:true, default:'nowhere'},
      zipcode: {type:'integer', required:true}
    }},
    tags: { type:'array', schema:{type:'string'} },
    books: {type:'array', schema:{
      title:{type:'string', default:'JRRT'},
      author:{schema:{first:{type:'string', default:'erp'}}}
    }}
  };

  it('values', function () {
    var res = Schema.cast( undefined, {default:10, filters:'toString'});
    expect( res ).to.equal( '10' );
  });

  it('arrays (of scalars)', function () {
    var s = {gir:{schema:{type:'string', filters:['toString']}}};

    var data = {gir:['a','b',4]};
    data = Schema.cast( data, s );
    expect( typeof data.gir[2] ).to.equal( 'string' );
  });

  it('arrays (of objects)', function () {
    var res = Schema.cast( [{smoo:1},{}], s.books );
    expect( res[0] ).to.have.keys( 'smoo', 'title' );
    expect( res[0].title ).to.equal('JRRT');
  });

  it('objects', function () {
    var res = Schema.cast( {}, s.address );
    expect(res.city).to.equal('nowhere');
  });
});
