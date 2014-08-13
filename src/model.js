
var ms = require('./schema');

/**
 * Expose `schema`
 */

module.exports = Model;


/**
 * Create a Model# **object** accessed as `schema(key)`
 *
 * **Models** describe resources comprised of properties and methods
 *
 * @param {String} key The unique identifier for the Model#
 * @param {Adapter} [adapter] Optional adapter to use for this new Model#
 * @param {Object} [options]
 *
 * @class Model
 * @constructor
 */

function Model( key, adapter, options ) {

  /**
   * Unique identifying key to reference schema( key )
   *
   * @type {String}
   * @property key
   */

  this.key = key;


  /**
   * Set the default `idAttribute` to 'id'
   * Modify this if your datasource uses an alternative form ('_id' for Mongo)
   */

  this.idAttribute = 'id';


  /**
   * The `resource` used by an adapter to reference this type of model
   * In effect this is the 'table' or 'document' reference in the datastore
   * Defaults to lowercase `Model.key`
   *
   * eg. "User" -> "user"
   *
   * @type {String}
   */

  this.resource = key.toLowerCase();


  /**
   * Properties
   *
   * @type {Model}
   */

  this.properties = {};

  /**
   * Methods
   *
   * @type {Array}
   */

  this.methods = [];


  /**
   * Placeholders for schema middleware
   * @private
   */

  this._pre = {};
  this._post = {};


  /**
   * Initial config defaults
   */

  this.config = {
    castOnSet: true,
    validateOnSet: false
  };

  // Apply options
  if (options) for (var key in options) this.config[key] = options[key];


  /**
   * Internal pointer to any instanced adapter (Set with `.useAdapter()`)
   *
   * @type {Adapter}
   * @see https://github.com/mekanika/adapter
   */

  this.adapter = adapter;
}


/**
 * Helper method to apply a middleware `fn` to a `stack` on `event`
 *
 * @param {Array} stack The schema middleware reference array to push onto
 * @param {String} event The name of the event to apply middleware on
 * @param {Function} fn The method to run, passed ( Query# )
 *
 * @private
 */

function middleware( stack, event, fn ) {
  var _act = event;
  var _hook = fn;

  // Support passing a pure (fn) applying to `all` events
  if (typeof event === 'function' ) {
    _act = 'all';
    _hook = event;
  }

  if (!stack[ _act ]) stack[ _act ] = [];

  // Fold in reference to `this` Model# in the middleware `fn`
  function _fn() {
    var self = this;
    return function() {
      return _hook.apply( self, arguments );
    };
  }

  stack[ _act ].push( _fn.call( this ) );
  return this;
}


/**
 * Delegation method to setup pre middleware to the Model#query()
 *
 * @param {String|Function} event The name of the event to apply middleware on (assumes `all` if passed a function)
 * @param {Function} fn The method to run, passed ( Query# )
 *
 * @return {this}
 */

Model.prototype.pre = function( event, fn ) {
  middleware.call( this, this._pre, event, fn );
};


/**
 * Delegation method to setup post middleware to the Model#query()
 *
 * @param {String|Function} event The name of the event to apply middleware on (assumes `all` if passed a function)
 * @param {Function} fn The method to run, passed ( err, res )
 *
 * @return {this}
 */

Model.prototype.post = function( event, fn ) {
  middleware.call( this, this._post, event, fn );
};


/**
 * Set an explicit adapter to use with this schema
 *
 * Updates an internal pointer to a given `adapter`, used by `Model.prototype.query()`
 *
 * @param {Adapter} adapter An Adapter# instance
 *
 * @return {Model} This schema
 */

Model.prototype.useAdapter = function( adapter ) {
  // Ensure we have an approximately valid adapter
  var adapterError = new Error( 'Must supply valid adapter');
  if (!adapter || !adapter.exec) throw adapterError;

  this.adapter = adapter;

  return this;
};


/**
 * Returns a property by `key`, or undefined if not found
 *
 * @param {String} key The unique identifier for the Property
 *
 * @return {Property|undefined}
 */

Model.prototype.path = function( key ) {
  return this.properties[key];
};


/**
 * Model properties returned as flat array
 *
 * @return {Array}
 */

Model.prototype.getPaths = function() {
  var keys = [];
  for (var key in this.properties) keys.push( key );
  return keys;
};


/**
 * Model required properties returned as flat array
 *
 * @return {Array}
 */

Model.prototype.getRequiredPaths = function() {
  var p = this.properties,
      rp = [];

  for (var key in p) if (p[key].required) rp.push( key );

  return rp;
};


/**
 * Add a new property to the schema structure
 * Overwrites is property is already defined
 *
 * @param {String} key
 * @param {Model} [schema] Mekanika schema options
 *
 * @return {Model}
 */

Model.prototype.prop = function( key, schema ) {
  schema || (schema = {});
  this.properties[key] = schema;
  return this;
};

Model.prototype.property = Model.prototype.attr = Model.prototype.prop;


/**
 * Shortcut method to validate an arbitrary value against a property's rules
 *
 * @param {String} property The property key
 * @param {Mixed} value
 *
 * @return {Array} of errors (empty if none)
 */

Model.prototype.validate = function (property, value) {
  var scm = this.path( property );
  if (!scm) throw new Error('No such property defined: '+property);

  return ms.test( value, scm );
};


/**
 * Add prototype methods on Records
 *
 * @param {String} methodName An identifier for the method
 * @param {Function} fn The Function defining the method
 *
 * @return {Model}
 */

Model.prototype.method = function( methodName, fn ) {
  if (!methodName || !fn)
    throw new Error('Must define both `methodName` and `fn`');

  if (typeof methodName !== 'string')
    throw new Error('`methodName` must be a String');

  if (typeof fn !== 'function')
    throw new Error('`fn` must be a Function');

  this.methods.push( {key:methodName, fn:fn} );
  return this;
};
