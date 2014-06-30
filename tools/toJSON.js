/**
 * @module schema.exportAsJSON
 */

/**
 * Convert a Schema# to a JSON string representation
 *
 * @param {Schema} schema
 * @param {Mixed} [pretty] Optional format string for JSON.stringify
 *
 * @return {JSON} A JSON string representation of the Schema
 * @method exportAsJSON
 */

module.exports = function exportAsJSON( schema, pretty ) {
  // JSON stringify formatting
  pretty || (pretty = 0);

  // Return object
  var o = {};

  // Assumes array of functions to run .toString() on
  var step = function ( arr ) {
    var ret = [];
    arr.forEach( function (fn) {

      // Process `rule` objects if present
      if (typeof fn === 'object' && fn.rule) {
        fn.rule = fn.rule.toString();
        ret.push( JSON.stringify( fn ) );
      }

      // Otherwise treat as an array of functions
      else ret.push( fn.toString() );

    });
    return ret;
  }

  for (var attr in schema) {

    // Don't touch prototype properties
    if ( !schema.hasOwnProperty( attr ) ) continue;
    // Ignore "_private" properties
    if ( attr[0] === '_' ) continue;

    // Need to call .toString() on any embedded functions
    // Handle 'methods' explicitly
    if (attr === 'methods') {
      var storeMethods = [];
      schema.methods.forEach( function (mObj) {
        var nm = {};
        nm.key = mObj.key;
        nm.fn = mObj.fn.toString();
        storeMethods.push( nm );
      });
      o.methods = storeMethods;
    }

    // Handle 'properties' explicitly
    else if (attr === 'properties') {
      var p = [];
      // Step through props, and clone with explicit handlers for fn arrays
      schema.properties.forEach( function (prop) {
        var k = {};
        for (var el in prop) {
          if (!prop.hasOwnProperty( el )) continue;
          if (el === 'setters') k.setters = step( prop.setters );
          else if (el === 'getters') k.getters = step( prop.getters );
          else if (el === 'rules') k.rules = step( prop.rules );
          else k[ el ] = prop[ el ];
        };
        p.push( k );
      });
      o.properties = p;
    }

    // Non explicit handler - just add the property to the exported object
    else o[ attr ] = schema[ attr ];
  }

  return JSON.stringify( o, null, pretty );
};
