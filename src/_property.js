
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

