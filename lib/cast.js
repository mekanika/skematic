

var is = require('mekanika-lsd/is');
var accessor = require('./schema').accessor;
var filter = require('./filters').filter;
var setDefault = require('./default').default;

/**
  Expose module
  @ignore
*/

module.exports = exports = {};


/**
  Helper method: Applies a default and runs filters on a `val`

  @param {Mixed} val The value to cast
  @param {Schema} schema The schema to apply to the value

  @throws {Error} on failed filter
  @return the cast value
*/

var _cast = exports.cast = function (val, schema) {

  var curKey;

  try {
    // Cast objects
    if (is.object(val) ) {
      // First check that we're not at a ROOT level schema (which is a
      // request to deepcast an object, NOT step through keys)
      if (schema.schema) return _deepcast( val, schema );

      for (var key in schema) {
        curKey = key;
        if (val.hasOwnProperty(key))
          val[key] = _cast( val[key], schema[key] );
      }
      return val;
    }
    // Cast everything else
    else {
      return schema.schema
        ? _deepcast( val, schema )
        : filter( setDefault( val, schema ), schema.filters );
    }
  }
  catch (e) {
    var err = [e.message];
    if (curKey) err.push( curKey );
    throw e;
  }
};


/**
  Casts (default+filter) arrays and objects that are described by sub-schema
  Destructively operates on the data provided (ie. overwrites provided values)
  (Useful when being passed custom Class objects and not simple primitives)

  @param {Object|Array} data
  @param {Schema} schema containing sub-schema declarations

  @return cast values
*/

var _deepcast = function (data, schema) {
  // No sub-schema to deepcast, just do a normal cast
  if (!schema.schema) return _cast(data, schema);

  // @todo This is where we'd check that the `data` is an object (To cast)
  // IF it's just a scalar (number or string) it's probably an identifier
  // so don't deepcast, just do a normal cast.
  // IF it's `undefined` then assume a deepcast is required.

  // Load a string referenced schema from an accessor (expects a SCHEMA)
  if ('string' === typeof schema.schema)
    schema.schema = accessor( schema.schema );

  var setO = function ( obj, scm, ret ) {
    for (var key in scm) {
      var cast = _deepcast( obj[key], scm[key] );
      if (typeof cast !== 'undefined') ret[key] = cast;
    }
    return ret;
  };

  switch (is.type(data)) {
    case 'array':
      // Step through each element
      for (var i=0; i<data.length; i++) {

        // Array 'data' is actually a Collection.
        if (is.object(data[i]))
          data[i] = setO( data[i], schema.schema, data[i] );

        // Treat the contents as scalar values
        else data[i] = _cast( data[i], schema.schema );

      }

      break;

    case 'object':
      data = setO( data, schema.schema, data );
      break;
  }

  return data;
};
