
/**
  Import type checker
  @ignore
*/

var is = require('mekanika-lsd/is');


/**
  Import default setter
  @ignore
*/

var setDefault = require('./default');


/**
  `Skematic` provides methods to structure and valid data.
  @module Skematic
*/

module.exports = exports;


/**
  Internal register for accessor method
  @ignore
*/

var _access = function (ref) {
  throw new Error('No accessor method found. Cannot load reference: '+ref);
};


/**
  Accessor mechanism to load a 'schema' by a String reference

  Method MUST either throw an Error or return a valid **Schema**.

  Used when presented with subschema string references that are not resolved,
  but referenced by a string. These methods delegate to `exports.accessor(ref)`
  to attempt to load the schema.

  This method is designed to be overwritten by a wrapper library that stores
  schema by 'string' reference.

  @param {String} ref Unique key reference to schema

  @throws {Error} Thrown when no accessor method has been provided
  @returns {Schema} schema object
*/

exports.accessor = function (ref) {
  if (is.function(ref)) _access = ref;
  else return _access(ref);
};


/**
  Returns an object built on ALL values present in the schema, set to defaults

  @param {Schema} schema To initialise object

  @return {Object}
*/

exports.createFrom = function (schema, nullValue) {
  var o = {};

  if (!schema) return o;

  for (var k in schema) {
    if (!schema.hasOwnProperty(k)) continue;
    o[k] = setDefault( nullValue, schema[k] );
    // Ensure undefined type:'array' is set to [] (unless overridden)
    if (schema[k].type === 'array' && o[k] === nullValue) o[k] = [];
  }

  return o;
};


/**
  Expose loading library of functions for compute
  @ignore
*/

exports.loadLib = require('./compute').loadLib;


/**
  Expose validation surface
  @ignore
*/

exports.validate = require('./validate');


/**
  Expose format surface
  @ignore
*/

exports.format = require('./format');
