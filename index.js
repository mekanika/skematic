var Schema = require( './src/model');

/**
 * Expose `schema`
 */

module.exports = schema;


/**
 * Stores all created Schemas
 *
 * @type {Object}
 * @private
 */

var cache = {};

/**
 * Adapter to use for all schema with no explicit adapter declared
 *
 * @private
 */

var adapter;


/**
 * Return a cached `schema` instance identified by `key`
 *
 * @param {String} key
 * @module schema
 * @borrows load as load
 */

function schema( key ) {
  if (!key) throw new Error('schema( key ) requires a key to lookup');

  if (cache[ key ]) return cache[ key ];
  else throw new Error('Cannot find schema: '+key);
}


/**
 * Expose `Schema` Class constructor via schema.Schema
 *
 * @member Schema
 * @static
 */

schema.Schema = Schema;


/**
 * Create a new schema
 *
 * @param {String} key
 * @param {Object} [options] Options to initialise schema
 *
 * @method new
 * @static
 */

schema.new = function (key, options) {
  if (!key) throw new Error('Requires a key to create');
  if (cache[ key ]) throw new Error( 'Already exists: '+key );

  // Store a named reference in cache and return it
  return ( cache[ key ] = new Schema( key, adapter, options ) );
};


/**
 * Expose .load( schemaConfig ) loader
 */

schema.load = require('./src/load.js');


/**
 * Removes a schema from the internal cache
 *
 * @param {String} id
 *
 * @method unload
 * @static
 */

schema.unload = function (id) {
  return cache[ id ]
    ? delete cache[ id ]
    : false;
};


/**
 * Returns a list of keys for all declared schema
 *
 * @method list
 * @returns {Array}
 * @static
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
 * @method has
 * @returns {Boolean}
 * @static
 */

schema.has = function ( id ) {
  return cache[ id ] ? true : false;
};


/**
 * Reset entire schema class - nukes the internal `cache` and `adapter`
 *
 * @method reset
 * @alias flush
 * @static
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
 * @method useAdapter
 * @static
 */

schema.useAdapter = function( ad ) {
  // Set the internal reference
  adapter = ad;

  // Apply adapter to any schema without one
  for (var s in cache)
    cache[s].adapter || cache[s].useAdapter( ad );
};
