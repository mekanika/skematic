
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

import setDefault from './default'
import transform from './transform'
import strip from './strip'
import {canCompute, computeValue as compute} from './compute'
import idMap from './idmap'

/**
  Formats a data object according to model rules.

  Order of application is significant: 1. Defaults, 2. Generate, 3. Transform.

  The options hash may contain:
  > Legend: **name** _{Type}_ `default`:

  - **strict** _{Boolean}_ - `false` Strips any fields not declared on model
  - **sparse** _{Boolean}_ - `false` only process keys on data (not full model)
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

  @param {Model} model The model to format to
  @param {Mixed} data The data to format
  @param {Object} opts Options hash

  @return {Object} A fresh copy of formatted data

  @memberof Skematic
  @alias format
*/

function format (model, data, opts = {}) {
  if (data == null) return createFrom(model)

  // Apply bulk formatters
  let res = _dive(model, data, opts)

  // Map the idField if provided
  if (opts.mapIdFrom) idMap(model, res, opts.mapIdFrom)

  return res
}

/**
  Returns an object built on ALL values present in the model, set to defaults
  and having been run through `.format()` with default flags.

  @param {Model} model To initialise object
  @param {Mixed} nullValue

  @return {Object}
  @private
*/

function createFrom (model, nullValue) {
  let o = {}

  if (!model) return o

  for (let k in model) {
    if (!model.hasOwnProperty(k)) continue
    o[k] = setDefault(nullValue, model[k])
    // Ensure undefined type:'array' is set to [] (unless overridden)
    if (model[k].type === 'array' && o[k] === nullValue) o[k] = []

    // Setup the models for any defined sub-model on OBJECT types
    if (model[k].model) {
      // Only apply to objects or assume 'object' if type not defined
      if (!model[k].type || model[k].type === 'object') {
        o[k] = createFrom(model[k].model)
      }
    }
  }

  // Now format the new object
  o = format(model, o, {once: true})

  return o
}

/**
  Checks that `source` permissions (what you HAVE) meet `target` permissions
  (what you NEED). Returns `true` if so, `false` if not.

  @param {String|String[]} source A scope string or Array of scopes (HAVE)
  @param {String|String[]} target A scope string or Array of scopes (NEED)

  @returns {Boolean} Are target permissions present in source permissions
  @private
*/

function isIn (source, target) {
  // No target permissions? Always passes
  if (!target || !target.length) return true

  // Note: indexOf works for Arrays AND String scalars
  if (!Array.isArray(source)) return target.indexOf(source) > -1

  let present = false
  source.forEach(val => {
    if (target.indexOf(val) > -1) present = true
  })

  return present
}

/**
  Internal method to apply the modifier functions (default, generate etc)

  @param {Object} data The parent (root) data to pass to generate for 'this' ref
  @param {Model} ss The model to apply (default: {})
  @param {Object} opts The options hash
  @param {Mixed} value The (likely SCALAR) value to be formatted

  @return Formatted value
  @private
*/

function _makeValue (data = {}, ss = {}, opts, val) {
  // Set defaults
  if (opts.defaults !== false) {
    if (!is.undefined(ss.default)) val = setDefault(val, ss)
  }

  // Run generators
  if (opts.generate !== false) {
    // Sets up the "runOnce" flag if `opts.compute = 'once'`
    var runOnce = opts.generate !== false && opts.once

    var args = [ss, {once: runOnce}]
    if (arguments.length > 3) args.push(val)

    if (canCompute.apply(null, args)) {
      // Handle generators flagged as 'once'
      if (ss.generate.once) {
        if (runOnce) val = compute(ss, {once: true}, val, data)

      // All other generators run every time
      } else val = compute(ss, {}, val, data)
    }
  }

  // Apply transforms
  if (opts.transform !== false) {
    if (ss.transforms) val = transform(val, ss.transforms, data)
  }

  return val
}

/**
  Internal method to recurse through a model and apply _makeValue. Handles
  scalars, arrays and object data.

  @param {Model} skm The model to apply
  @param {Mixed} payload The (likely OBJECT) data to be formatted
  @param {Object} opts The options hash
  @param {Object} parentData The original data payload (used for ref)

  @return A fresh copy of formatted data (no mutation)
  @private
*/

function _dive (skm, payload, opts, parentData) {
  // On the odd chance we reach here with no `skm` model defined
  if (!skm) return payload

  // Placeholder for formatted data
  let out

  let data = payload
  if (!parentData) parentData = data

  // -- OBJECT
  // Process data as an object
  if (is.object(data)) {
    // Create a copy of the object
    data = {...data}

    // Strip keys not declared on schea if in 'strict' mode
    if (opts.strict) {
      const modelKeys = Object.keys(skm)
      Object.keys(data).forEach(function (k) {
        if (modelKeys.indexOf(k) < 0) delete data[k]
      })
    }

    let step = skm
    // Switch to parsing only provided keys on sparse data
    if (opts.sparse) step = data

    for (let key in step) {
      // Shorthand the model model to use for this value
      let model = skm[key]
      // Some field names won't have a model defined. Skip these.
      if (!model) continue

      // Remove data fields that are flagged as locked
      if (!opts.unlock && skm[key] && skm[key].lock) {
        delete data[key]
      }

      // Show/hide scope permissions projection
      // (`unscope:true` prevents using 'scopes' permissions)
      if (!opts.unscope && model.show && !isIn(opts.show, model.show)) {
        delete data[key]
        // Skips any further processing
        continue
      }

      // Handle value of field being an Array
      if (is.array(data[key]) || model.type === 'array') {
        out = _dive(model, data[key], opts, parentData)
      } else {
        let args = [parentData, model, opts]
        if (Object.keys(data).indexOf(key) > -1) args.push(data[key])
        out = _makeValue.apply(null, args)

        // Special case handle objects with sub-model
        // Apply the sub-model to the object output
        if (is.object(out) && model.model) {
          out = _dive(model.model, out, opts, parentData)
        }
      }

      // Only apply new value if changed (ensures 'undefined' values are
      // not automatically added to ABSENT keys on the data object)
      if (out !== data[key]) data[key] = out
    }
  } else if (is.array(data) && skm.model) {
    // Create a copy of the array
    data = data.slice()
    // ARRAY (with sub-model)
    // Process data as an array IF there is a sub-model to format against
    for (let i = 0; i < data.length; i++) {
      // Recurse through objects
      if (is.object(data[i])) {
        data[i] = _dive(skm.model, data[i], opts, parentData)
      } else {
        // Or simply "makeValue" for everything else
        out = _makeValue(parentData, skm.model, opts, data[i])
        if (data[i] !== out) data[i] = out
      }
    }
  } else {
    // NORMAL VALUE
    // Process as scalar value
    out = _makeValue(parentData, skm, opts, data)
    if (out !== data) data = out
  }

  // Remove any matching field values
  if (opts.strip) strip(opts.strip, data)

  return data
}

/**
  Export module
  @ignore
*/

module.exports = format
module.exports.isIn = isIn
