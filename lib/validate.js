
var is = require('mekanika-lsd/is');
var Rules = require('./rules');
var setDefault = require('./default').default;

module.exports = exports = {};

// The default "failed validation" message. Appended with ' $key' where
// `$key` is the key of the validation rule that failed.
var defaultError = 'Failed:';

function errMsg (key) {
  return defaultError + ' ' + key;
}


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

var accessor = require('./schema').accessor;


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
    if (!is.undefined(val) && !is[ schema.type ](val))
      return ['Not of type: '+schema.type];
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
    if (!scm.required && Rules.empty( setDefault(v,scm) )) continue;

    // Recursively Validate sub-schema
    if (scm.schema) {

      // Load a string referenced schema from an accessor (expects a SCHEMA)
      if ('string' === typeof scm.schema) scm.schema = accessor( scm.schema );

      // Arrays can be either raw 'values' or complex 'objects'
      if (scm.type === 'array' || v instanceof Array) {

        // Don't attampt to process 'v' if it's not set
        if (!v) continue;

        // Step through the values in the array
        v.forEach(function(val,idx) {

          // Array of complex objects
          if (is.type(val) === 'object') {
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
};
