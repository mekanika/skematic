
/**
  Dependencies
*/

var Compute = require('./compute');
var is = require('mekanika-lsd/is');


/**
  Export this module
*/

module.exports = exports;


/**
  Set default function library to empty
  @ignore
*/

exports.lib = {};


/**
  Load in a library of functions

  @param {Object} fno An Object of keyed functions `{key:function()...}`
  @function
*/

exports.loadLib = function (fno) { exports.lib = fno; };


/**
  Apply compute facilities
*/

exports.compute = Compute.computeAll;


/**
  Apply compute to `{once:true}` fields
*/

exports.computeOnce = function (d, s) { return Compute.computeAll(d,s,true); };


exports.default = require('./default');
exports.transform = require('./transform');
exports.format = require('./format');

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
    o[k] = exports.default( nullValue, schema[k] );
    // Ensure undefined type:'array' is set to [] (unless overridden)
    if (schema[k].type === 'array' && o[k] === nullValue) o[k] = [];
  }

  return o;
};

// Internal register for accessor method
var _access = function (ref) {
  throw new Error('No accessor method found. Cannot load reference: '+ref);
};

exports.accessor = function (ref) {
  if (is.function(ref)) _access = ref;
  else return _access(ref);
};
exports.validSchema = require('./validate').validSchema;
exports.checkValue = require('./validate').checkValue;
exports.validate = require('./validate').validate;
exports.sparseValidate = require('./validate').sparseValidate;
