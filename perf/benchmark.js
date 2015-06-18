
// Check if we're in a browser
var inBrowser = typeof window !== 'undefined';

// Setup to run in browser (expects Skematic global) or CommonJS
if (!inBrowser) var Skematic = require('../index');

// A reasonably complex schema
var s = {
  name: {type: 'string'},
  address: { schema: {
    street: {schema: {
      number: {type: 'integer', required: true},
      name: {type: 'string', rules: {maxLength: 5}}
    }},
    city: {type: 'string', required: true},
    zipcode: {type: 'integer', required: true}
  }},
  tags: { type: 'array', schema: {type: 'string'} },
  books: {type: 'array', schema: {
    title: {type: 'string'},
    author: {type: 'string'}
  }}
};

// ----------
// Data to validate
var invalid = {
  name: 'zim',
  address: {
    street: {number: 4},
    city: 'mrrn',
    zipcode: 5151},
  tags: ['hello', '20'],
  books: [{title: 'WOT', author: 'RJ'}, {title: 'GOT', author: 555}]
};

// Only difference is the second book is Valid
var valid = {
  name: 'zim',
  address: {
    street: {number: 4},
    city: 'mrrn',
    zipcode: 5151},
  tags: ['hello', '20'],
  books: [{title: 'WOT', author: 'RJ'}, {title: 'GOT', author: '555'}]
};

var start, end;

console.log('Skematic benchmark: validation run...');

var count = 50000;
var NUM_VALIDATES = 2;

if (inBrowser) count = 10000;

function run (cnt) {
  start = (new Date()).valueOf();
  cnt || (cnt = count);
  for (var i = 0; i < count; i++) {
    // Run both a passing and failing run (NUM_VALIDATES = 2)
    Skematic.validate(s, invalid);
    Skematic.validate(s, valid);
  }
  end = (new Date()).valueOf();

  var elapsed = end - start;

  var resDone = 'Completed ' + cnt * NUM_VALIDATES / 1000 + 'k';
  var resTime = 'in ' + Math.floor(elapsed / 100) / 10 + ' seconds';
  var resSpeed = Math.floor(cnt * NUM_VALIDATES / elapsed * 10) / 10 + 'k/s';

  var output = resDone + ' ' + resTime + '\n' + resSpeed;

  console.log(output);
  if (inBrowser) {
    var out = document.getElementById('out');
    out.innerHTML = output;
  }
}

if (!inBrowser) run();
