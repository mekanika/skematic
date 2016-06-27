
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

import {_getSchema as getSchema} from './api';
import setDefault from './default';
import transform from './transform';
import strip from './strip';
import {canCompute, computeValue as compute} from './compute';
import idMap from './idmap';

/**
  Export module
*/

export default format;

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

  @param {Schema} skm The schema to format to
  @param {Object} opts Options hash
  @param {Mixed} data The data to format

  @return {Object}

  @memberOf module:Skematic
  @alias format
*/

function format (skm, opts, data) {

  if (arguments.length === 2) {
    data = arguments[1];
    opts = {};
  }

  // Set a default for `opts`
  if (!opts) opts = {};

  // Apply bulk formatters
  let res = _dive(skm, opts, data);

  // Map the idField if provided
  if (opts.mapIdFrom) idMap(skm, res, opts.mapIdFrom);

  return res;
}

/**
  Internal method to apply the modifier functions (default, generate etc)

  @param {Schema} ss The schema to apply
  @param {Object} opts The options hash
  @param {Mixed} value The (likely SCALAR) value to be formatted

  @return Formatted value
  @private
*/

function _makeValue (ss, opts, val) {

  // Set empty object default for schema as it's possible to provide an empty
  // `ss` if applying a sub-schema that has not been defined
  if (!ss) ss = {};

  // Set defaults
  if (opts.defaults !== false) {
    if (!is.undefined(ss.default)) val = setDefault(val, ss);
  }

  // Run generators
  if (opts.generate !== false) {
    // Sets up the "runOnce" flag if `opts.compute = 'once'`
    var runOnce = opts.generate === 'once';

    var args = [ss, {once: runOnce}];
    if (arguments.length > 2) args.push(val);

    if (canCompute.apply(null, args)) {
      // Handle generators flagged as 'once'
      if (ss.generate.once) {
        if (runOnce) val = compute(ss, {once: true}, val);
      }
      // All other generators run every time
      else val = compute(ss, {}, val);
    }
  }

  // Apply transforms
  if (opts.transform !== false) {
    if (ss.transforms) val = transform(val, ss.transforms);
  }

  return val;
}

/**
  Internal method to recurse through a schema and apply _makeValue. Handles
  scalars, arrays and object data.

  @param {Schema} ss The schema to apply
  @param {Object} opts The options hash
  @param {Mixed} data The (likely OBJECT) data to be formatted

  @return The formatted data
  @private
*/

function _dive (skm, opts, data) {
  // On the odd chance we reach here with no `skm` schema defined
  // (This happened in real-world testing scenarios)
  if (!skm) return data;

  // Placeholder for formatted data
  let out;

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if (is.string(skm.schema)) skm.schema = getSchema(skm.schema);

  // -- OBJECT
  // Process data as an object
  if (is.object(data)) {

    if (opts.copy) data = {...data}

    // Strip keys not declared on schea if in 'strict' mode
    if (opts.strict) {
      const schemaKeys = Object.keys(skm);
      Object.keys(data).forEach(function (k) {
        if (schemaKeys.indexOf(k) < 0) delete data[k];
      });
    }

    let step = skm;
    // Switch to parsing only provided keys on data if a) dynamic or b) sparse
    if (skm.$dynamic || opts.sparse) step = data;

    for (let key in step) {
      // Define the schema to use for this value
      let model = skm.$dynamic ? skm.$dynamic : skm[key];
      // Some field names won't have a schema defined. Skip these.
      if (!model) continue;

      // Handle value of field being an Array
      if (is.array(data[key]) || model.type === 'array') {
        out = _dive(model, opts, data[key]);
      } else {
        let args = [model, opts];
        if (Object.keys(data).indexOf(key) > -1) args.push(data[key]);
        out = _makeValue.apply(null, args);

        // Special case handle objects with sub-schema
        // Apply the sub-schema to the object output
        if (is.object(out) && model.schema) {
          out = _dive(model.schema, opts, out);
        }
      }

      // Only apply new value if changed (ensures 'undefined' values are
      // not automatically added to ABSENT keys on the data object)
      if (out !== data[key]) data[key] = out;
    }

  } else if (is.array(data) && skm.schema) {
    // ARRAY (with sub-schema)
    // Process data as an array IF there is a sub-schema to format against
    if (opts.copy) data = data.slice()

    for (let i = 0; i < data.length; i++) {
      // Recurse through objects
      if (is.object(data[i])) {
        data[i] = _dive(skm.schema, opts, data[i]);

      } else {
        // Or simply "makeValue" for everything else
        out = _makeValue(skm.schema, opts, data[i]);
        if (data[i] !== out) data[i] = out;
      }
    }

  } else {
    // NORMAL VALUE
    // Process as scalar value
    out = _makeValue(skm, opts, data);
    if (out !== data) data = out;
  }

  // Remove any matching field values
  if (opts.strip) strip(opts.strip, data);

  return data;

}
