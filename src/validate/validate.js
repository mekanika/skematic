
/**
  Module dependencies
  @ignore
*/

import is from '../is'
import * as Rules from '../rules'
import setDefault from '../default'
import checkValue from './checkValue'

/**
  Expose the module
  @ignore
*/

export {validate, checkValue}

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
  schema.validate({type:'string'}, '1')
  // -> {valid:true, errors:[]}

  schema.validate({name:{type:'string'}}, {name:'Zim'})
  // -> {valid: true, errors:{}}
  ```

  @param {Schema} schema The data structure rules used for validation
  @param {Object} [opts] Optional options `{sparse:true}` to only parse data keys
  @param {Object|Mixed} data The data item to validate

  @return {Object} Validation object `{valid:$bool, errors:$Object|Array}`

  @memberof Skematic
  @alias validate
*/

function validate (schema, data, opts = {}) {
  if (opts.keyCheckOnly) return _checkKeys(schema, data)
  else if (opts.sparse) return _sparse(data, schema)
  else return _validate(data, schema)
}

/**
  Checks that the keys on the data object

  @param {Schema} schema The data structure rules used for validation
  @param {Object|Mixed} data The data item to validate

  @return {Object} Validation object `{valid:$bool, errors:$Object|Array}`
  @private
*/

function _checkKeys (schema, data) {
  let ret = {
    valid: true,
    errors: {}
  }

  if (!is.object(data)) {
    return {valid: false, errors: {data: ['Invalid data']}}
  }

  const MAX_USER_KEY_LEN = 16
  for (let key in data) {
    if (!schema[key]) {
      ret.valid = false

      // Sanitize user keylength
      const shortKey = key.length > MAX_USER_KEY_LEN
        ? key.substr(0, MAX_USER_KEY_LEN - 3) + '...'
        : key

      ret.errors[shortKey] = [`Invalid key: ${shortKey}`]
    }
  }

  return ret
}

/**
  Internal method that handles the validation of arbitrary `data`.

  @param {Mixed} data Either a scalar, array or object to validate
  @param {Schema} schema The data structure to use for validation rules

  @return {Object} `{valid:bool, errors:hash|array}`
  @private
*/

function _validate (data, schema) {
  let errs = {}

  // Validate scalars
  if (!is.object(data)) {
    let res = checkValue(data, schema)
    return res.length
      ? {valid: false, errors: res}
      : {valid: true, errors: null}
  }

  // Step through ONLY our schema keys
  // (Note: sparse validation of known keys happens in `_sparse()`)
  for (let key in schema) {
    // Shorthand schema model reference
    let scm = schema[key]
    // Only handle own properties
    if (!scm) continue

    // Shorthand
    let v = data[key]

    // If it's not required and the default value is 'empty', skip it
    // Note: 'allowNull: false' is NOT NULL. Disallows empty.
    const isRequired = scm.required || scm.allowNull === false
    if (!isRequired && Rules.empty(setDefault(v, scm))) continue

    // Recursively Validate sub-schema
    if (scm.schema) {
      // Arrays can be either raw 'values' or complex 'objects'
      if (scm.type === 'array' || v instanceof Array) {
        // Don't attampt to process 'v' if it's not set
        if (!v) continue

        v.forEach((val, idx) => {
          // Array of complex objects
          if (is.type(val) === 'object') {
            let arsub = _validate(val, scm.schema)
            if (!arsub.valid) {
              if (!errs[key]) errs[key] = {}
              errs[key][idx] = arsub.errors
            }
          } else {
            // Array of simple types
            let er = checkValue(val, scm.schema, data)
            if (er.length) {
              if (!errs[key]) errs[key] = {}
              errs[key][idx] = er
            }
          }
        })
      } else {
        // Otherwise just assume it's an object
        let sub = _validate(v, scm.schema)
        if (!sub.valid) errs[key] = sub.errors
      }

      // Otherwise NO sub-schema: test the value directly
    } else {
      let errors = checkValue(v, scm, data)
      if (errors.length) errs[key] = errors
    }
  }

  // Return errors:null if no errors
  if (Object.keys(errs).length < 1) errs = null

  return {
    valid: !errs,
    errors: errs
  }
}

/**
  Validates ONLY the keys on the data object, NOT the keys on the schema

  @param {Object} data The keyed data object to validate
  @param {Schema} schema The schema rules

  @return {Object} Validation object `{valid:$bool, errors:$Object}`
  @private
*/

function _sparse (data, schema) {
  let isValid = true
  let errs = {}
  let out

  for (let key in data) {
    // Only valid with an associated schema
    if (!schema[key]) continue

    out = _validate(data[key], schema[key])
    if (!out.valid) {
      isValid = false
      errs[key] = out.errors
    }
  }

  return {
    valid: isValid,
    errors: errs
  }
}
