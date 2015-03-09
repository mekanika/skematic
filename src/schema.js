
/**
  Dependencies
*/

var Cast = require('./cast');
var Rules = require('./rules');
var Compute = require('./compute');


/**
  Export this module
*/

module.exports = exports;


/**
  Set default function library to empty
*/

exports.lib = {};


/**
  Load in a library of functions

  @param {Object} fno An Object of keyed functions `{key:function()...}`
  @function
*/

exports.loadLib = function (fno) { exports.lib = fno; };


/**
  Apply compute facilities
*/

exports.compute = Compute.computeAll;


/**
  Apply compute to `{once:true}` fields
*/

exports.computeOnce = function (d, s) { return Compute.computeAll(d,s,true); };


/**
  Accessor mechanism to load a 'schema' by a String reference

  Method MUST either throw an Error or return a valid **Schema**.

  Used by `.deepcast()` and `.validate()` when these are presented with
  subschema that are not resolved, but referenced by a string. These methods
  delegate to `exports.accessor(ref)` to attempt to load the schema.

  This method is designed to be overwritten by a wrapper library that stores
  schema by 'string' reference.

  @param {String} ref Unique key reference to schema

  @throws {Error} Thrown when no accessor method has been provided
  @returns {Schema} schema object
*/

exports.accessor = function (ref) {
  throw new Error('No accessor method found. Cannot load reference: '+ref);
};


/**
  Sets a default value if specified on empty fields

  Supports passing an object and complex schema.

  @param {Mixed} v The value or object to default
  @param {Schema} schema The associated schema to check the default value on

  @return Value or the default value
*/

exports.default = function (v, schema) {

  if (!schema) return v;

  var def = function (v, s) {
    // No default, return the value as is
    if (s.default === undefined) return v;

    // Return the default if `v` is empty (ie. undefined or '')
    return Rules.empty(v) ? s.default : v;
  };

  // Parse objects
  if (typeof v === 'object') {
    for (var k in schema) {
      if (schema[k].default) v[k] = def( v[k], schema[k] );
    }

    return v;
  }
  // Or simply return defaulted scalars
  else return def(v, schema);
};



/**
  Returns an object built on ALL values present in the schema, set to defaults

  @param {Schema} schema To initialise object

  @return {Object}
*/

exports.createFrom = function (schema) {
  var o = {};

  if (!schema) return o;

  for (var k in schema) {
    if (!schema.hasOwnProperty(k)) continue;
    o[k] = exports.default( undefined, schema[k] );
  }

  return o;
};


/**
  Available filter functions (modifiers for value)
*/

var _filters = {
  trim: function(v) { return v.trim(); },
  nowhite: function (v) { return v.replace( / /g, ''); },
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

  // Do not attempt to filter 'undefined' values
  if (val === undefined) return val;

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

  @return {Array}
*/

exports.filter.available = function () {
  return Object.keys(_filters);
};


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
  Returns the [[Class]] subjugate

  @param {Mixed} obj The entity to type check

  @return {String} type
*/

var toType = exports.toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};


/**
  Type check

  Explicit tests on `{type:$TypeFn}` declarations. Same as 'Rules'
*/

var is = {
  string: function (v) { return typeof v === 'string'; },
  integer: function (v) { return typeof v === 'number' && v%1 === 0 && !isNaN(v);},
  number: function (v) { return toType(v) === 'number' && !isNaN(v); },
  array: function (v) { return toType(v) === 'array'; },
  boolean: function (v) { return toType(v) === 'boolean'; },
  object: function (v) { return toType(v) === 'object'; }
};


/**
  Checks that a `val` is of `type`

  Runs `val` against a 'type' function that returns boolean if the
  value meets its criteria.

  Does **NOT** type check undefined values.

  @param {Mixed} val The value to test
  @param {String} type The name of the type check to run

  @return {Array} errors
*/

exports.typeCheck = function ( val, type ) {
  if (!is[ type ]) return ['Unknown type to check: '+type];

  return val === undefined || is[ type ](val)
    ? []
    : ['Not of type: '+type];
};


/**
  Helper method: Applies a default and runs filters on a `val`

  @param {Mixed} val The value to cast
  @param {Schema} schema The schema to apply to the value

  @throws {Error} on failed filter
  @return the cast value
*/

var _cast = exports.cast = function (val, schema) {

  try {
    // Cast objects
    if (is.object(val) ) {
      // First check that we're not at a ROOT level schema (which is a
      // request to deepcast an object, NOT step through keys)
      if (schema.schema) return _deepcast( val, schema );

      for (var key in schema) {
        if (val.hasOwnProperty(key))
          val[key] = _cast( val[key], schema[key] );
      }
      return val;
    }
    // Cast everything else
    else {
      return schema.schema
        ? _deepcast( val, schema )
        : exports.filter( exports.default( val, schema ), schema.filters );
    }
  }
  catch(e) { throw e; }
};


/**
  Casts (default+filter) arrays and objects that are described by sub-schema
  Destructively operates on the data provided (ie. overwrites provided values)
  (Useful when being passed custom Class objects and not simple primitives)

  @param {Object|Array} data
  @param {Schema} schema containing sub-schema declarations

  @return cast values
*/

var _deepcast = function (data, schema) {
  // No sub-schema to deepcast, just do a normal cast
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
  };

  switch (toType(data)) {
    case 'array':
      // Step through each element
      for (var i=0; i<data.length; i++) {

        // Array 'data' is actually a Collection.
        if (is.object(data[i]))
          data[i] = setO( data[i], schema.schema, data[i] );

        // Treat the contents as scalar values
        else data[i] = _cast( data[i], schema.schema );

      }

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


// The default "failed validation" message. Appended with ' $key' where
// `$key` is the key of the validation rule that failed.
var defaultError = 'Failed:';

function errMsg (key) {
  return defaultError + ' ' + key;
}


/**
  Checks a value against the rules defined in `schema`

  Does **NOT** apply rules to undefined values that are not `required`

  @param {Mixed} val The value to test
  @param {Object} schema The schema to apply the tests against

  @return {Array} errors
*/

exports.checkValue = function (val, schema) {
  var errs = [];

  if (!schema) return errs;

  // Check required...
  if (schema.required) {
    if (!Rules.required( val )) return ['Required to be set'];
  }

  // Not required and unset returns WITHOUT check
  if (val === undefined) return errs;

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
  Validates `data` against a schema's rules. Does not pre-cast data.

  Returns:

  {
    valid: {Boolean},
    errors: {Object|Array} // Error object if passed object, array if scalar
  }

  Example:

  ```
  schema.validate( '1', {type:'string'} );
  // -> {valid:true, errors:[]}

  schema.validate( {name:'Zim'}, {name:{type:'string'}});
  // -> {valid: true, errors:{}}
  ```

  @return {Object} Validation object `{valid:$bool, errors:$Object|Array}`
*/

exports.validate = function (data, schema, _noCheck) {
  var errs = {};
  var isValid = true;

  // Validate scalars
  if (!is.object(data)) {
    var res = exports.checkValue( data, schema );
    return res.length
      ? {valid:false, errors:res}
      : {valid:true, errors:[]};
  }


  // Step through ONLY our schema keys
  for (var key in schema) {
    // Only handle own properties
    if (!schema.hasOwnProperty(key)) continue;

    // Shorthand
    var scm = schema[key];
    var v = data[key];

    // Self validate schema
    if (!_noCheck) {
      var chk = exports.validate( JSON.parse(JSON.stringify(scm)), validSchema, true );
      if (!chk.valid)
        throw new Error('Invalid schema: ' +
          JSON.stringify(chk.errors) +
          ' - {"' + key +'":'+ JSON.stringify(scm) + '}' );
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

        // Don't attampt to process 'v' if it's not set
        if (!v) continue;

        // Step through the values in the array
        v.forEach(function(val,idx) {

          // Array of complex objects
          if (toType(val) === 'object') {
            var arsub = exports.validate( val, scm.schema );
            if (!arsub.valid) {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = arsub.errors;
            }
          }

          // Array of simple types
          else {
            var er = exports.checkValue( val, scm.schema );
            if (er.length) {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = er;
            }
          }
        });
      }

      // Otherwise just assume it's an object
      else {
        var sub = exports.validate( v, scm.schema );
        if (!sub.valid) {
          isValid = false;
          errs[key] = sub.errors;
        }
      }
    }

    // Otherwise NO sub-schema: test the value directly
    else {
      var errors = exports.checkValue( v, scm );
      if (errors.length) {
        isValid = false;
        errs[key] = errors;
      }
    }
  }

  return {
    valid: isValid,
    errors: errs
  };
};


/**
  Validates ONLY the keys on the data object, NOT the keys on the schema

  @param {Object} data The keyed data object to validate
  @param {Schema} schema The schema rules

  @return {Object} Validation object `{valid:$bool, errors:$Object}`
*/

exports.sparseValidate = function (data, schema) {
  var isValid = true;
  var errs = {};
  var out;

  for (var key in data) {
    // Only valid with an associated schema
    if (!schema[key]) continue;

    out = exports.validate(data[key], schema[key]);
    if (!out.valid) {
      isValid = false;
      errs[key] = out.errors;
    }
  }

  return {
    valid: isValid,
    errors: errs
  };
}

