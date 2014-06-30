var Schema = require( './src/schema')
  , reserved = require( './src/reservedtypes' ).reservedTypes;


/**
 * Expose `schema`
 */

module.exports = schema;


/**
 * Stores all created Schemas
 *
 * @private {Object}
 */

var cache = {};

/**
 * Adapter to use for all schema with no explicit adapter declared
 *
 * @private
 */

var adapter;


/**
 * Initialise (or retrieve a cached) `Schema#` identified by `name`
 *
 * @param {String} name
 * @public
 */

function schema( name ) {
  if (!name) throw new Error('schema( name ) requires a name to lookup');

  if (reserved[ name ]) throw new Error('Schema name `'+name+'` is reserved');

  if (cache[ name ]) return cache[ name ];

  // Store a named reference in cache and return it
  return ( cache[ name ] = new Schema( name, adapter ) );
}


/**
 * Expose .load( schemaConfig ) loader
 *
 * @public
 */

schema.load = require('./src/load.js');


/**
 * Removes a schema from the internal cache
 *
 * @param {String} id
 *
 * @public
 */

schema.unload = function (id) {
  return cache[ id ]
    ? delete cache[ id ]
    : false;
};


/**
 * Expose `Schema` constructor via schema.Schema
 *
 * @public
 */

schema.Schema = Schema;


/**
 * Returns a list of keys for all declared schema
 *
 * @returns {Array}
 * @public
 */

schema.list = function() {
  var ret = [];
  for (var s in cache)
    if (s !== 'undefined') ret.push( s );

  return ret;
};


/**
 * Existence operator (does schema `id` exist)
 *
 * @param {String} id Named identifier for the schema
 *
 * @returns {Boolean}
 * @public
 */

schema.has = function ( id ) {
  return cache[ id ] ? true : false;
};


/**
 * Reset entire schema class - nukes the internal `cache` and `adapter`
 *
 * @public
 */

schema.flush = schema.reset = function() {
  cache = {};
  adapter = undefined;
};


/**
 * Applies a global adapter to use for schemas with none
 *
 * @param {Adapter} ad The adapter to use
 *
 * @public
 */

schema.useAdapter = function( ad ) {
  // Set the internal reference
  adapter = ad;

  // Apply adapter to any schema without one
  for (var s in cache)
    cache[s].adapter || cache[s].useAdapter( ad );
};
