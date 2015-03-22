
/**
  Import utilities
  @ignore
*/

var is = require('mekanika-lsd/is');


/**
  Import Skematic tools
  @ignore
*/

var getSchema = require('./api')._getSchema
  , setDefault = require('./default')
  , transform = require('./transform')
  , canCompute = require('./compute').canCompute
  , compute = require('./compute').computeValue;


/**
  Export module
*/

module.exports = format;


/**
  Formats a data object according to schema rules.

  Order of application is significant: 1. Defaults, 2. Generate, 3. Transform.

  The options hash may contain:
  > Legend: **name** _{Type}_ [`default`]:

  - **sparse** _{Boolean}_ - [`false`] only process keys on data (not full schema)
  - **defaults** _{Boolean}_ - [`true`] set default values
  - **generate:** _{Boolean|String}_ - [`true`] Compute values (pass `"once"` to run compute-once fields)
  - **transform** _{Boolean}_ - [`true`] apply transform functions

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

  return _dive( skm, opts, data );
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
    if (ss.default) val = setDefault( val, ss );
  }

  // Run generators
  if (opts.generate !== false) {
    // Sets up the "runOnce" flag if `opts.compute = 'once'`
    var runOnce = opts.generate === 'once' ? true : false;

    var args = [ss, {once:runOnce}];
    if (arguments.length > 2) args.push(val);

    // Ensure blah
    if (canCompute.apply(null, args)) {
      // Handle generators flagged as 'once'
      if (ss.generate.once) {
        if (runOnce) val = compute(ss, {once:true}, val);
      }
      // All other generators run every time
      else val = compute( ss, {}, val );
    }
  }

  // Apply transforms
  if (opts.transform !== false) {
    if (ss.transforms) val = transform( val, ss.transforms );
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

function _dive(skm, opts, data) {

  // Placeholder for formatted data
  var out;

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if (is.string(skm.schema)) skm.schema = getSchema( skm.schema );

  // Keep a reference of datakeys (so we're not running this every loop)
  var dkeys = opts.sparse ? Object.keys(data) : [];

  // Process data as an object
  if (is.object(data)) {
    for (var key in skm) {
      // ONLY process keys on PROVIDED data if `sparse:true`
      if (opts.sparse && dkeys.indexOf(key) < 0) continue;

      // Handle value of field being an Array
      if (is.array(data[key])) out = _dive( skm[key], opts, data[key] );

      // Otherwise Apply the embedded schema (if any)
      else if (skm[key].schema) {
        var val = data[key];
        if (!val) val = skm[key].type === 'array' ? [] : {};
        out = _dive(skm[key].schema, opts, val);
      }

      // Or finally just run `makeValue` directly
      else {
        var args = [skm[key], opts];
        if (Object.keys(data).indexOf(key) > -1) args.push(data[key]);
        out = _makeValue.apply( null, args);
      }

      // Only apply new value if changed (ensures 'undefined' values are
      // not automatically added to ABSENT keys on the data object)
      if (out !== data[key]) data[key] = out;
    }
  }

  // Process data as an array
  else if (is.array(data) && skm.schema) {

    for (var i=0; i<data.length; i++) {
      // Recurse through objects
      if (is.object(data[i])) {
        data[i] = _dive(skm.schema, opts, data[i]);
      }
      // Or simply "makeValue" for everything else
      else {
        out = _makeValue( skm.schema, opts, data[i] );
        if (data[i] !== out) data[i] = out;
      }
    }
  }

  // Process as scalar value
  else {
    out = _makeValue( skm, opts, data );
    if (out !== data) data = out;
  }

  return data;

}
