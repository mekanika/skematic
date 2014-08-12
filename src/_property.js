
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
  Designed to be overwritten

  @param {String} ref Unique key reference to schema

  @throws {Error} Thrown when no accessor method has been provided
  @returns {Schema} schema object
*/

exports.accessor = function (ref) {
  throw new Error('No accessor method found. Cannot load reference: '+ref);
};


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
    // Try-catch is to make it CLEAR that this can throw
    // May be useful in future to do more than propagate throw
    try {
      if ( _filters[key] ) val = _filters[key]( val );
    }
    catch( e ) { throw e; }
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
  integer: function (v) { return typeof v === 'number' && v%1 === 0 && !isNaN(v);},
  number: function (v) { return toType(v) === 'number' && !isNaN(v) },
  array: function (v) { return toType(v) === 'array'; },
  boolean: function (v) { return toType(v) === 'boolean'; },
  object: function (v) { return toType(v) === 'object'; }
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
  try {
    if (schema.filters) val = exports.filter( val, schema.filters );
  }
  catch(e) {
    return ['Failed to apply filter'];
  }


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


/**
  Helper method: Applies a default and runs filters on a `val`

  @param {Mixed} val The value to cast
  @param {Schema} schema The schema to apply to the value

  @throws {Error} on failed filter
  @return the cast value
*/

var _cast = exports.cast = function (val, schema) {
  // Clarify that cast can throw (filters failing)
  try {
    return schema.schema
      ? _deepcast( val, schema )
      : exports.filter( exports.default( val, schema ), schema.filters );
  }
  catch(e) { throw e; }
}


/**
  Casts (default+filter) arrays and objects that are described by sub-schema
  Destructively operates on the data provided (ie. overwrites provided values)
  (Useful when being passed custom Class objects and not simple primitives)

  @param {Object|Array} data
  @param {Schema} schema containing sub-schema declarations

  @return cast values
*/

var _deepcast = function (data, schema) {
  // No sub=schema to deepcast, just do a normal cast
  if (!schema.schema) return _cast(data, schema);

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if ('string' === typeof schema.schema)
    schema.schema = exports.accessor( schema.schema );

  var setO = function ( obj, scm, ret ) {
    for (var key in scm) {
      var cast = _deepcast( obj[key], scm[key] );
      if (typeof cast !== 'undefined') ret[key] = cast;
    }
    return ret;
  }

  switch (toType(data)) {
    case 'array':
      // Array 'data' is actually a Collection.
      for (var i=0; i<data.length; i++)
        data[i] = setO( data[i], schema.schema, data[i] );
      break;

    case 'object':
      data = setO( data, schema.schema, data );
      break;
  }

  return data;
};


/**
  The schema for a valid schema (used to validate schema objects)
*/

var validSchema = exports.validSchema = {
  type: {type:'string', rules:{in:Object.keys(is)}},
  required: {type:'boolean'},
  rules: {type:'object'},
  filters: {schema:{type:'string'}},
  array: {type:'boolean'},
  default: {},
  allowNull: {type:'boolean'}
};


/**
  Validates complex data objects

  @throws {Error} when provided invalid schema to validate against

  @return {Object} Validation object `{$dataObj, $validBool, $errorsObj}`
*/

exports.validate = function (data, schema, _noCheck) {
  var dx = {};
  var errs = {};
  var isValid = true;

  // Step through ONLY our schema keys
  for (var key in schema) {
    // Only handle own properties
    if (!schema.hasOwnProperty(key)) continue;

    // Shorthand
    var scm = schema[key];
    var v = data[key];

    // Self validate schema
    if (!_noCheck) {
      var chk = exports.validate( scm, validSchema, true );
      if (!chk.valid)
        throw new Error('Invalid schema: ' + JSON.stringify(chk.errors));
    }

    // If it's not required and the default value is 'empty', skip it
    if (!scm.required && Rules.empty( exports.default(v,scm) )) continue;

    // Recursively Validate sub-schema
    if (scm.schema) {

      // Load a string referenced schema from an accessor (expects a SCHEMA)
      if ('string' === typeof scm.schema)
        scm.schema = exports.accessor( scm.schema );

      // Arrays can be either raw 'values' or complex 'objects'
      if (scm.type === 'array' || v instanceof Array) {

        // Step through the values in the array
        v.forEach(function(val,idx) {

          // Array of complex objects
          if (toType(val) === 'object') {
            var arsub = exports.validate( val, scm.schema );
            if (arsub.valid) {
              if (!dx[key]) dx[key] = [];
              dx[ key ][idx] = arsub.data;
            }
            else {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = arsub.errors;
            }
          }

          // Array of simple types
          else {
            var er = exports.test( val, scm.schema );
            if (er.length) {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = er;
            }
            else {
              if (!dx[key]) dx[key] = [];
              dx[key][idx] = _cast( val, scm.schema );
            }
          }
        });
      }

      // Otherwise just assume it's an object
      else {
        var sub = exports.validate( v, scm.schema );
        if (sub.valid) dx[key] = sub.data;
        else {
          isValid = false;
          errs[key] = sub.errors;
        }
      }
    }

    // Otherwise NO sub-schema: test the value directly
    else {
      var errors = exports.test( v, scm );
      if (errors.length) {
        isValid = false;
        errs[key] = errors;
      }
      else
        dx[key] = _cast( v, scm );
    }
  }

  return {
    data: isValid ? dx : data,
    valid: isValid,
    errors: errs
  };
};

