/**
  @module schema.exportAsJSON
*/


/**
  Converts any functions in an object (deep) to strings and returns the
  JSON string representation of the object.

  @example
  var exportAsJSON = require('./tools/toJSON');
  var obj = { key: true, fn: function(arg) { return arg; } };

  JSON.stringify( obj, 2 );
  // {
  //   "key": true
  // }

  exportAsJSON( obj, 2 );
  // {
  //   "key": true,
  //   "fn": "function(arg) { return arg; }"
  // }

  @param {Object} obj to convert to JSON
  @param {Number} [prettyIndent] Indentation on output

  @return {JSON}
  @method exportAsJSON
*/

module.exports = function (obj, prettyIndent ) {

  // Converts any Function attributes (or values in arrays) on `o` to strings
  function strFn( o ) {
    var ret = {};

    for (var key in o) {
      // Only attempt to convert own properties
      if (!o.hasOwnProperty(key)) continue;

      // Skip "private" properties
      if (key[0] === '_') continue;

      // Deal with Arrays
      if (o[key] instanceof Array) {
        var ar = [];
        o[key].forEach( function(el) {
          if (!el) return;
          // Array of functions?
          if (typeof el === 'function') ar.push( el.toString() );
          // Array of other things:
          else {
            typeof el === 'object' && Object.keys( el ).length
              ? ar.push( strFn(el) )
              : ar.push( el );
          }
        });
        ret[key] = ar;
      }
      // Deal with objects
      else if ( typeof o[key] === 'object' && Object.keys( o[key] ).length )
        ret[key] = strFn( o[key] );
      // Deal with everything else
      else {
        ret[key] = typeof o[key] === 'function'
          ? o[key].toString()
          : o[key];
      }
    }
    return ret;
  }

  return JSON.stringify( strFn( obj ), null, prettyIndent );
};
