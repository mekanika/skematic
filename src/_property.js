
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
  // No-op if no filters
  if (!filters) return val;

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


/**
  Adds a named `key` filter `fn`

  @param {String} key The identifier for the filter
  @param {Function} fn The filter function (passed `v` and returns modified `v`)
*/

exports.filter.add = function (key, fn) {
  _filters[ key ] = fn;
};


/**
  Cross browser object 'type' checker
  Helper: returns the [[Class]] subjugate

  @return {String} type
*/

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};


/**
  Type check

  Explicit tests on `{type:$TypeFn}` declarations. Same as 'Rules'
*/

var is = {
  string: function (v) { return typeof v === 'string'; },
  integer: function (v) { return typeof v === 'number' && v%1 === 0 && !isNaN(v);}
};


/**
  Checks that a `val` is of `type`

  Runs `val` against a 'type' function that returns boolean if the
  value meets its criteria.

  @param {Mixed} val The value to test
  @param {String} type The name of the type check to run

  @return {Array} errors
*/

exports.typeCheck = function ( val, type ) {
  if (!is[ type ]) return ['Unknown type to check: '+type];

  return is[ type ](val)
    ? []
    : ['Not of type: '+type];
};



// The default "failed validation" message. Appended with ' $key' where
// `$key` is the key of the validation rule that failed.
var defaultError = 'Failed:';

function errMsg (key) {
  return defaultError + ' ' + key;
}


/**
  Checks a value against the rules defined in `schema`

  @param {Mixed} val The value to test
  @param {Object} schema The schema to apply the tests against

  @return {Array} errors
*/

exports.test = function (val, schema) {
  var errs = [];

  if (!schema) return errs;

  val = exports.default( val, schema );

  // 1. Apply transforms (filters)
  if (schema.filters) val = exports.filter( val, schema.filters );


  // Check required...
  if (schema.required) {
    if (!Rules.required( val )) return ['Required to be set'];
  }


  // 2. Check type match
  // The value type matches its declaration (if any)
  if (schema.type) {
    var res = exports.typeCheck(val, schema.type);
    if (res.length) return res;
  }


  // 3. Validate rules
  for (var key in schema.rules) {
    // Build parameters to pass to rule
    var params = schema.rules[key];
    if ( !(params instanceof Array) ) params = [params];
    params.unshift( val );

    // Check that the rule exists to run against
    if (!Rules[key]) {
      errs.push('Unknown rule: '+key);
      continue;
    }

    // Run validation
    var isValid = Rules[key].apply( this, params );
    if (!isValid) {
      // Failed validation adds error to stack
      if (schema.errors) {
        if (typeof schema.errors === 'string') errs.push( schema.errors );
        else if (schema.errors[key]) errs.push( schema.errors[key] );
        else if (schema.errors.default) errs.push( schema.errors.default );
        else errs.push( errMsg(key) );
      }
      else errs.push( errMsg(key) );
    }
  }

  // Return errors
  return errs;
};


