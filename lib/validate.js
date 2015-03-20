
/**
  Module dependencies
  @ignore
*/

var is = require('mekanika-lsd/is')
  , accessor = require('./api').accessor
  , Rules = require('./rules')
  , setDefault = require('./default');


/**
  Expose the module
  @ignore
*/

module.exports = exports = validate;


/**
  Internal error message generator
  @ignore
*/

function errMsg (key) {
  // The default "failed validation" message. Appended with ' $key' where
  // `$key` is the key of the validation rule that failed.
  var defaultError = 'Failed:';
  return defaultError + ' ' + key;
}


/**
  The schema for a valid schema (used to validate schema objects)
*/

var validSchema = exports.validSchema = {
  type: {type:'string', rules:{in:Object.keys(is)}},
  required: {type:'boolean'},
  rules: {type:'object'},
  transform: {schema:{type:'string'}},
  array: {type:'boolean'},
  default: {},
  allowNull: {type:'boolean'}
};


/**
  Validates `data` against a schema's rules.

  If passed "opts" `{sparse:true}`, validation is only run on the fields in
  the data objected provided. Default is `false`, so validation is run on
  all fields in the provided `schema`

  Returns:

  ```
  {
    valid: {Boolean},
    // Error object if data is object, array if scalar
    errors: {Object|Array}
  }
  ```

  Example:

  ```
  schema.validate( {type:'string'}, '1' );
  // -> {valid:true, errors:[]}

  schema.validate( {name:{type:'string'}}, {name:'Zim'} );
  // -> {valid: true, errors:{}}
  ```

  @param {Schema} schema The data structure rules used for validation
  @param {Object} [opts] Optional options `{sparse:true}` to only parse data keys
  @param {Object|Mixed} data The data item to validate

  @return {Object} Validation object `{valid:$bool, errors:$Object|Array}`

  @memberOf module:Skematic
  @alias validate
*/

function validate(schema, opts, data) {

  // Initialise an empty object opts default if not provided
  if (!opts) opts = {};

  // Support passing only TWO arguments `(schema,data)`
  if (arguments.length === 2 ) {
    data = arguments[1];
    opts = {};
  }

  if (opts.sparse) return _sparse( data, schema );
  else return _validate( data, schema );
};


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
  Internal method that handles the validation of arbitrary `data`.

  @param {Mixed} data Either a scalar, array or object to validate
  @param {Schema} schema The data structure to use for validation rules

  @return {Object} `{valid:bool, errors:hash|array}`
  @private
*/

function _validate(data, schema, _noCheck) {
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
      var chk = _validate( JSON.parse(JSON.stringify(scm)), validSchema, true );
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
            var arsub = _validate( val, scm.schema );
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
        var sub = _validate( v, scm.schema );
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
}


/**
  Validates ONLY the keys on the data object, NOT the keys on the schema

  @param {Object} data The keyed data object to validate
  @param {Schema} schema The schema rules

  @return {Object} Validation object `{valid:$bool, errors:$Object}`
  @private
*/

function _sparse(data, schema) {
  var isValid = true;
  var errs = {};
  var out;

  for (var key in data) {
    // Only valid with an associated schema
    if (!schema[key]) continue;

    out = _validate(data[key], schema[key]);
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
