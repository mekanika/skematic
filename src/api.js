
/**
  `Skematic` provides methods to structure and valid data.
  @module Skematic
*/

/**
  Import type checker
  @ignore
*/

import is from './is'

/**
  Import default setter
  @ignore
*/

import setDefault from './default'

/**
  Internal reference for Schemas (if any)
  (Used for 'string' lookups of schema)
  @private
*/

let _schemas = {}

/**
  Internal method for other modules to access any loaded Schemas above
  @param {String} ref The string reference to lookup
  @throws {Error} if no reference found
  @return {Schema}
  @private
*/

function _getSchema (ref) {
  let ret = _schemas[ref]
  if (!ret) throw new Error('No schema found for: ' + ref)
  return ret
}

/**
  Loads a hash of schemas to use for lookups by string.

  Used when presented with subschema string references that are not resolved,
  but referenced by a string. These methods lookup references on an obj:

  ```js
  var schemas = {
    name: {type:'string'},
    age: {type:'number'} // etc.
  }
  ```

  @param {Object} schemas Hash of schemas
*/

function useSchemas (s) {
  _schemas = s
}

/**
  Returns an object built on ALL values present in the schema, set to defaults
  and having been run through `.format()` with default flags.

  @param {Schema} schema To initialise object

  @return {Object}
*/

function createFrom (schema, nullValue) {
  let o = {}

  if (!schema) return o
  if (is.string(schema)) schema = exports._getSchema(schema)

  for (let k in schema) {
    if (!schema.hasOwnProperty(k)) continue
    o[k] = setDefault(nullValue, schema[k])
    // Ensure undefined type:'array' is set to [] (unless overridden)
    if (schema[k].type === 'array' && o[k] === nullValue) o[k] = []

    // Setup the models for any defined sub-schema on OBJECT types
    if (schema[k].schema) {
      // Only apply to objects or assume 'object' if type not defined
      if (!schema[k].type || schema[k].type === 'object') {
        o[k] = createFrom(schema[k].schema)
      }
    }
  }

  // Now format the new object
  o = format(schema, {once: true}, o)

  return o
}

/**
  Expose loading library of functions for compute
  @ignore
*/

import {useGenerators} from './compute'

/**
  Expose validation surface
  @ignore
*/

import {validate} from './validate'

/**
  Expose format surface
  @ignore
*/

import format from './format'

// Export the library
export {
  _schemas as models,
  _getSchema,
  createFrom,
  format,
  useGenerators,
  useSchemas,
  validate
}
