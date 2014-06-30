/**
  @namespace utils
*/

/**
 * Dependencies
 * @private
 */

var types = require( './reservedtypes' ).reservedTypes;


/**
 * Expose module
 */

module.exports = exports;


/**
 * Removes 'undefined' keys from an object or array of objects
 *
 * Passes through any non array/non-objects
 *
 * @param {Mixed} obj The object/array requiring cleanup
 *
 * @return {Object} A cleaned object
 * @alias clean
 * @memberOf utils
 */

exports.clean = function clean( obj ) {

  // Clean each element of an array
  if (obj instanceof Array) return obj.map( clean, this );

  // Only touch objects, passthru all else
  if (typeof obj !== 'object' || obj === null) return obj;

  var ret = {};
  for (var el in obj) {
    if (typeof obj[el] !== 'undefined') ret[el] = obj[el];
  }
  return ret;

};


/**
 * Coerce recognised 'types' into a lowercase known format
 *
 * @param type to coerce
 *
 * @return a normalised type, or false if unrecognised
 * @memberOf utils
 * @alias normaliseType
 */

exports.normaliseType = function normaliseType( type ) {

  if (!type) return;

  // Handle known types
  switch( type ) {
    // Natives
    case Date: return types.date;
    case Number: return types.number;
    case String: return types.string;
    case Boolean: return types.boolean;
    case RegExp: return types.regexp;

    // Schema supported types
    case 'integer': return types.integer;
    case 'float': return types.float;
  }

  // Handle 'string' variants on core types
  var re = [ /String/i, /Date/i, /Number/i, /Boolean/i, /RegExp/i ];
  for (var i=0; i<re.length; i++ )
    if (re[i].test( type ))
      return type.toLowerCase ? type.toLowerCase() : type;

  // Arrays are not cool as 'types'
  if (/Array/i.test( type )) throw new Error('type:Array is not allowed');

  return false;

};
