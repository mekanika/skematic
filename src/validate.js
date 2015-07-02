
/**
  Module dependencies
  @ignore
*/

import is from 'mekanika-lsd/is';
import {_getSchema as getSchema} from './api';
import * as Rules from './rules';
import setDefault from './default';

/**
  Expose the module
  @ignore
*/

export {validate, checkValue};

/**
  Internal error message generator
  @ignore
*/

function errMsg (key) {
  // The default "failed validation" message. Appended with ' $key' where
  // `$key` is the key of the validation rule that failed.
  return 'Failed: ' + key;
}

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
  schema.validate({type:'string'}, '1');
  // -> {valid:true, errors:[]}

  schema.validate({name:{type:'string'}}, {name:'Zim'});
  // -> {valid: true, errors:{}}
  ```

  @param {Schema} schema The data structure rules used for validation
  @param {Object} [opts] Optional options `{sparse:true}` to only parse data keys
  @param {Object|Mixed} data The data item to validate

  @return {Object} Validation object `{valid:$bool, errors:$Object|Array}`

  @memberOf module:Skematic
  @alias validate
*/

function validate (schema, opts, data) {

  // Initialise an empty object opts default if not provided
  if (!opts) opts = {};

  // Support passing only TWO arguments `(schema,data)`
  if (arguments.length === 2) {
    data = arguments[1];
    opts = {};
  }

  if (opts.sparse || schema.$dynamic) return _sparse(data, schema);
  else return _validate(data, schema);
}

/**
  Checks a value against the rules defined in `schema`

  Does **NOT** apply rules to undefined values that are not `required`

  @param {Mixed} val The value to test
  @param {Object} schema The schema to apply the tests against

  @return {Array} errors
  @private
*/

function checkValue (val, schema) {
  let errs = [];

  if (!schema) return errs;

  // Not required and unset returns WITHOUT check
  if (val === undefined && !schema.required) return errs;

  const setError = (schema, key, errs) => {
    // Failed validation adds error to stack
    if (schema.errors) {
      if (typeof schema.errors === 'string') errs.push(schema.errors);
      else if (schema.errors[key]) errs.push(schema.errors[key]);
      else if (schema.errors.default) errs.push(schema.errors.default);
      else errs.push(errMsg(key));
    }
    else errs.push(errMsg(key));
    return errs;
  };

  // Bail out if required is present and fails
  // (It's not useful to run the other validations otherwise)
  if (schema.required) {
    if (!Rules.required(val)) return setError(schema, 'required', errs);
  }

  // 2. Check type match
  // The value type matches its declaration (if any)
  if (schema.type) {
    if (!is.undefined(val) && !is[ schema.type ](val)) {
      return [`Not of type: ${schema.type}`];
    }
  }

  // 3. Validate rules
  for (let key in schema.rules) {
    if (!schema.rules.hasOwnProperty(key)) continue;

    // Build parameters to pass to rule
    let params = schema.rules[key];
    if (!(params instanceof Array)) params = [params];
    params.unshift(val);

    // Check that the rule exists to run against
    if (!Rules[key]) {
      errs.push(`Unknown rule: ${key}`);
      continue;
    }

    // Run validation
    const isValid = Rules[key].apply(this, params);
    if (!isValid) setError(schema, key, errs);
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

function _validate (data, schema) {
  let errs = {};
  let isValid = true;

  // Validate scalars
  if (!is.object(data)) {
    let res = checkValue(data, schema);
    return res.length
      ? {valid: false, errors: res}
      : {valid: true, errors: null};
  }

  // Determine whether to step through the schema or the data
  // based on whether we're using $dynamic keys or fixed
  // (Note: sparse validation of known keys happens in `_sparse()`)
  let step = schema;
  if (schema.$dynamic) step = data;

  // Step through ONLY our schema keys
  for (let key in step) {
    let scm = schema.$dynamic ? schema.$dynamic : schema[key];
    // Only handle own properties
    if (!scm) continue;

    // Shorthand
    let v = data[key];

    // If it's not required and the default value is 'empty', skip it
    if (!scm.required && Rules.empty(setDefault(v, scm))) continue;

    // Recursively Validate sub-schema
    if (scm.schema) {

      // Load a string referenced model from an accessor (expects a SCHEMA)
      if (typeof scm.schema === 'string') scm.schema = getSchema(scm.schema);

      // Arrays can be either raw 'values' or complex 'objects'
      if (scm.type === 'array' || v instanceof Array) {

        // Don't attampt to process 'v' if it's not set
        if (!v) continue;

        // Step through the values in the array
        for (let i = 0; i < v.length; i++) {
          let val = v[i];
          let idx = i;

          // Array of complex objects
          if (is.type(val) === 'object') {
            let arsub = _validate(val, scm.schema);
            if (!arsub.valid) {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = arsub.errors;
            }
          } else {
            // Array of simple types
            let er = checkValue(val, scm.schema);
            if (er.length) {
              isValid = false;
              if (!errs[key]) errs[key] = {};
              errs[key][idx] = er;
            }
          }
        }
      } else {
        // Otherwise just assume it's an object
        let sub = _validate(v, scm.schema);
        if (!sub.valid) {
          isValid = false;
          errs[key] = sub.errors;
        }
      }

      // Otherwise NO sub-schema: test the value directly
    } else {

      let errors = checkValue(v, scm);
      if (errors.length) {
        isValid = false;
        errs[key] = errors;
      }
    }
  }

  // Return errors:null if no errors
  if (Object.keys(errs).length < 1) errs = null;

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

function _sparse (data, schema) {
  let isValid = true;
  let errs = {};
  let out;

  for (let key in data) {
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
