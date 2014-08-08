
/**

  Schema intends to work as follows:

  0. .default()   - Returns/Applies defaults if no value
  1. .filter()    - Run filters to transform the value (including casting)
  2. .typeCheck() - Check value matches expected 'type'
  3. .test()      - Apply any rules to validate content

  .validate() runs all the above and returns:
  {
    valid: true/false
    errors: [],
    value: $
  }
*/


/**
  Dependencies
*/

var Cast = require('./cast');
var Rules = require('./rules');


/**
  Export this module
*/

module.exports = exports;


/**
  Returns the default value in the schema if no `value` present

  @param {Mixed} v The value to default
  @param {Schema} schema The associated schema to check the default value on

  @return Value or the default value
*/

exports.default = function (v, schema) {
  // No default, return the value as is
  if (!schema || !schema.default) return v;

  // Return the default if `v` is empty (ie. undefined or '')
  return Rules.empty(v) ? schema.default : v;
};


/**
  Available filter functions (modifiers for value)
*/

var _filters = {
  trim: function(v) { return v.trim(); },
  uppercase: function (v) { return v.toUpperCase(); },
  lowercase: function (v) { return v.toLowerCase(); }
};

// Add 'to$CAST' casters to filters
for (var cast in Cast) if (cast.substr(0,2)==='to') _filters[cast] = Cast[cast];


/**
  Applies a list of filter functions

  @param {Mixed} val The value to filter
  @param {String[]} filters Array of named filters to apply

  @throws {Error} if filter cannot be applied
*/

exports.filter = function (val, filters) {
  // Ensure filters are provided as an array
  if (typeof filters === 'string') filters = [filters];

  filters.forEach( function (key) {
    try {
      if ( _filters[key] ) val = _filters[key]( val );
    }
    catch( e ) {
      console.log('Cannot apply filter: '+key);
      throw e;
    }
  });

  return val;
};


/**
  Exposes the available filters as an array

  @type Array
*/

exports.filter.available = Object.keys(_filters);

