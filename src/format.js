
/**
  Format methods are **not directly available** on the API, but are used by the
  `Skematic.format()` function to modify provided data.

  @namespace Format
*/

/**
  Import utilities
  @ignore
*/

import is from './is'

/**
  Import Skematic tools
  @ignore
*/

import {_getSchema as getSchema} from './api'
import setDefault from './default'
import transform from './transform'
import strip from './strip'
import {canCompute, computeValue as compute} from './compute'
import idMap from './idmap'

/**
  Export module
  @ignore
*/

export default format

/**
  Formats a data object according to schema rules.

  Order of application is significant: 1. Defaults, 2. Generate, 3. Transform.

  The options hash may contain:
  > Legend: **name** _{Type}_ `default`:

  - **strict** _{Boolean}_ - `false` Strips any fields not declared on schema
  - **sparse** _{Boolean}_ - `false` only process keys on data (not full schema)
  - **defaults** _{Boolean}_ - `true` set default values
  - **generate** _{Boolean|String}_ - `true` Compute values (pass `"once"` to run compute-once fields)
  - **transform** _{Boolean}_ - `true` apply transform functions
  - **strip** _{Array}_ `undefined` list of field values to strip from `data`
  - **mapIdFrom** _{String}_ `undefined` maps a primarykey field from the field name provided

  @example
  const Model = {name: {default: 'Player 1'}, created: {generate: Date.now}}

  format(Model, {mydata: 'demo'})
  // -> {name: 'Player 1', created: 1467139008992, mydata: 'demo'}

  format(Model, {name: 'Mo', mydata: 'demo'}, {strict: true})
  // -> {name: 'Mo', created: 1467139049234}

  @param {Schema} skm The schema to format to
  @param {Mixed} data The data to format
  @param {Object} opts Options hash

  @return {Object} A fresh copy of formatted data

  @memberof Skematic
  @alias format
*/

function format (skm, data, opts = {}) {
  if (data == null) return createFrom(skm)

  // Apply bulk formatters
  let res = _dive(skm, data, opts)

  // Map the idField if provided
  if (opts.mapIdFrom) idMap(skm, res, opts.mapIdFrom)

  return res
}

/**
  Returns an object built on ALL values present in the schema, set to defaults
  and having been run through `.format()` with default flags.

  @param {Schema} schema To initialise object
  @param {Mixed} nullValue

  @return {Object}
  @memberof Skematic
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
  o = format(schema, o, {once: true})

  return o
}

/**
  Internal method to apply the modifier functions (default, generate etc)

  @param {Schema} ss The schema to apply (default: {})
  @param {Object} opts The options hash
  @param {Mixed} value The (likely SCALAR) value to be formatted

  @return Formatted value
  @private
*/

function _makeValue (ss = {}, opts, val) {
  // Set defaults
  if (opts.defaults !== false) {
    if (!is.undefined(ss.default)) val = setDefault(val, ss)
  }

  // Run generators
  if (opts.generate !== false) {
    // Sets up the "runOnce" flag if `opts.compute = 'once'`
    var runOnce = opts.generate !== false && opts.once

    var args = [ss, {once: runOnce}]
    if (arguments.length > 2) args.push(val)

    if (canCompute.apply(null, args)) {
      // Handle generators flagged as 'once'
      if (ss.generate.once) {
        if (runOnce) val = compute(ss, {once: true}, val)

      // All other generators run every time
      } else val = compute(ss, {}, val)
    }
  }

  // Apply transforms
  if (opts.transform !== false) {
    if (ss.transforms) val = transform(val, ss.transforms)
  }

  return val
}

/**
  Internal method to recurse through a schema and apply _makeValue. Handles
  scalars, arrays and object data.

  @param {Schema} skm The schema to apply
  @param {Mixed} payload The (likely OBJECT) data to be formatted
  @param {Object} opts The options hash

  @return A fresh copy of formatted data (no mutation)
  @private
*/

function _dive (skm, payload, opts) {
  // On the odd chance we reach here with no `skm` schema defined
  // (This happened in real-world testing scenarios)
  if (!skm) return payload

  // Placeholder for formatted data
  let out

  let data = payload

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if (is.string(skm.schema)) skm.schema = getSchema(skm.schema)

  // -- OBJECT
  // Process data as an object
  if (is.object(data)) {
    // console.log('format as object')
    // Create a copy of the object
    data = {...data}

    // Strip keys not declared on schea if in 'strict' mode
    if (opts.strict) {
      const schemaKeys = Object.keys(skm)
      Object.keys(data).forEach(function (k) {
        if (schemaKeys.indexOf(k) < 0) delete data[k]
      })
    }

    let step = skm
    // Switch to parsing only provided keys on sparse data
    if (opts.sparse) step = data

    for (let key in step) {
      // Shorthand the schema model to use for this value
      let model = skm[key]
      // Some field names won't have a schema defined. Skip these.
      if (!model) continue

      // Remove data fields that are flagged as protected
      if (opts.protect !== false && skm[key] && skm[key].protect) {
        delete data[key]
      }

      // Handle value of field being an Array
      if (is.array(data[key]) || model.type === 'array') {
        out = _dive(model, data[key], opts)
      } else {
        let args = [model, opts]
        if (Object.keys(data).indexOf(key) > -1) args.push(data[key])
        out = _makeValue.apply(null, args)

        // Special case handle objects with sub-schema
        // Apply the sub-schema to the object output
        if (is.object(out) && model.schema) {
          out = _dive(model.schema, out, opts)
        }
      }

      // Only apply new value if changed (ensures 'undefined' values are
      // not automatically added to ABSENT keys on the data object)
      if (out !== data[key]) data[key] = out
    }
  } else if (is.array(data) && skm.schema) {
    // Create a copy of the array
    data = data.slice()
    // ARRAY (with sub-schema)
    // Process data as an array IF there is a sub-schema to format against
    for (let i = 0; i < data.length; i++) {
      // Recurse through objects
      if (is.object(data[i])) {
        data[i] = _dive(skm.schema, data[i], opts)
      } else {
        // Or simply "makeValue" for everything else
        out = _makeValue(skm.schema, opts, data[i])
        if (data[i] !== out) data[i] = out
      }
    }
  } else {
    // NORMAL VALUE
    // Process as scalar value
    out = _makeValue(skm, opts, data)
    if (out !== data) data = out
  }

  // Remove any matching field values
  if (opts.strip) strip(opts.strip, data)

  return data
}
