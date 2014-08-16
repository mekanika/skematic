var Model = require( './src/model')
  , schema = require( './src/schema' );

/**
 * Expose module
 */

module.exports = exports = models;


/**
 * Stores all created Models
 *
 * @type {Object}
 * @private
 */

var cache = {};


/**
 * Adapter to use for all models with no explicit adapter declared
 *
 * @private
 */

var adapter;


/**
 * Return a cached `Model` instance identified by `key`
 *
 * @param {String} key
 * @module models
 * @borrows load as load
 *
 * @return {Model}
 */

function models( key ) {
  if (!key) throw new Error('schema( key ) requires a key to lookup');

  if (cache[ key ]) return cache[ key ];
  else throw new Error('Cannot find schema: '+key);
}


/**
 * Expose `Model` Class constructor
 *
 * @member Model
 * @static
 */

exports.Model = Model;


/**
 * Expose `schema` library
 */

exports.schema = schema;


/**
 * Create a new Model
 *
 * @param {String} key
 * @param {Object} [opts] Options to initialise new Model
 *
 * @return {Model}
 * @method new
 * @static
 */

exports.new = function (key, opts) {
  if (!key) throw new Error('Requires a key to create');
  if (cache[ key ]) throw new Error( 'Already exists: '+key );

  opts || (opts = {});
  // Set the adapter to the global adapter if one is not defined
  if (adapter && !opts.adapter) opts.adapter = adapter;

  // Store a named reference in cache and return it
  return ( cache[ key ] = new Model( key, opts ) );
};


/**
 * Expose .load( schemaConfig ) loader
 */

exports.load = require('./src/load.js');


/**
 * Removes a Model from the internal cache
 *
 * @param {String} id
 *
 * @method unload
 * @static
 */

exports.unload = function (id) {
  return cache[ id ]
    ? delete cache[ id ]
    : false;
};


/**
 * Returns a list of keys for all declared Models
 *
 * @method list
 * @returns {Array}
 * @static
 */

exports.list = function() {
  var ret = [];
  for (var s in cache)
    if (s !== 'undefined') ret.push( s );

  return ret;
};


/**
 * Existence operator (does Model `id` exist)
 *
 * @param {String} id Named identifier for the Model
 *
 * @method has
 * @returns {Boolean}
 * @static
 */

exports.has = function ( id ) {
  return cache[ id ] ? true : false;
};


/**
 * Reset entire models accessors - nukes the internal `cache` and `adapter`
 *
 * @method reset
 * @alias flush
 * @static
 */

exports.flush = models.reset = function() {
  cache = {};
  adapter = undefined;
};


/**
 * Applies a global adapter to use for Models with none
 *
 * @param {Adapter} ad The adapter to use
 *
 * @method useAdapter
 * @static
 */

exports.useAdapter = function( ad ) {
  // Set the internal reference
  adapter = ad;

  // Apply adapter to any schema without one
  for (var s in cache)
    cache[s].adapter || cache[s].useAdapter( ad );
};
