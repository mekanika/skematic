
/**
  Import utilities
  @ignore
*/

var is = require('mekanika-lsd/is');


/**
  Import Skematic tools
  @ignore
*/

var accessor = require('./schema').accessor
  , setDefault = require('./default')
  , transform = require('./transform')
  , canCompute = require('./compute').canCompute
  , compute = require('./compute').computeValue;


/**
  Export module
*/

module.exports = format;


/**
  Formats a data object according to schema rules

  The options hash contains:

  - **sparse** _{Boolean}_ - [`false`] only process keys on data (not full schema)
  - **defaults** _{Boolean}_ - [`true`] set default values
  - **transform** _{Boolean}_ - [`true`] apply transform functions

  @param {Schema} skm The schema to format to
  @param {Object} opts Options hash
  @param data

  @return {Object}
*/

function format (skm, opts, data) {

  if (arguments.length < 3)
    throw new Error('Format requires data to work with');

  // Set a default for `opts`
  if (!opts) opts = {};

  return dive( skm, opts, data );
}


/**
  The magic applicator

  Order of application is significant: 1. Defaults, 2. Generate, 3. Transform.
*/

function makeValue (ss, opts, val) {

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
  Stepper
*/

var dive = function (skm, opts, data) {

  // Placeholder for formatted data
  var out;

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if (is.string(skm.schema)) skm.schema = accessor( skm.schema );

  // Keep a reference of datakeys (so we're not running this every loop)
  var dkeys = opts.sparse ? Object.keys(data) : [];

  // Process data as an object
  if (is.object(data)) {
    for (var key in skm) {
      // ONLY process keys on PROVIDED data if `sparse:true`
      if (opts.sparse && dkeys.indexOf(key) < 0) continue;

      // Handle value of field being an Array
      if (is.array(data[key])) out = dive( skm[key], opts, data[key] );

      // Otherwise Apply the embedded schema (if any)
      else if (skm[key].schema) {
        var val = data[key];
        if (!val) val = skm[key].type === 'array' ? [] : {};
        out = dive(skm[key].schema, opts, val);
      }

      // Or finally just run `makeValue` directly
      else {
        var args = [skm[key], opts];
        if (Object.keys(data).indexOf(key) > -1) args.push(data[key]);
        out = makeValue.apply( null, args);
      }

      // Only apply new value if changed (ensures 'undefined' values are
      // not automatically added to ABSENT keys on the data object)
      if (out !== data[key]) data[key] = out;
    }
  }

  // Process data as an array
  else if (is.array(data)) {
    for (var i=0; i<data.length; i++) {
      out = makeValue( skm.schema, opts, data[i] );
      if (data[i] !== out) data[i] = out;
    }
  }

  // Process as scalar value
  else {
    out = makeValue( skm, opts, data );
    if (out !== data) data = out;
  }

  return data;

};
