var Property = require( 'mekanika-property' )
  , utils = require( './utils' );


/**
 * Expose `schema`
 */

module.exports = Schema;


/**
 * Create a Schema# **object** accessed as `schema(name)`
 *
 * **Schemas** describe Object instances comprised of properties and methods
 *
 * @param {String} name The unique identifier for the Schema#
 * @param {Adapter} [adapter] Optional adapter to use for this new Schema#
 *
 * @class Schema
 * @constructor
 */

function Schema( name, adapter ) {

  /**
   * The Schema identity is the schema( identity ) reference
   *
   * @type {String}
   * @property identity
   */

  this.identity = name;


  /**
   * The `key` to address the adapter reference resource
   * In effect this is the 'table' or 'document' reference in the datastore
   * Defaults to lowercase `Schema.identity`
   *
   * eg. "User" -> "user"
   *
   * @type {String}
   */

  this.key = name.toLowerCase();


  /**
   * Properties
   *
   * @type {Property[]}
   */

  this.properties = [];

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

  // Middleware: Apply schema post middleware to all query actions
  ['save', 'find', 'create', 'remove', 'update'].forEach( function( act ) {

    // Convert resource responses to this schema
    this.post.call( this, act, this.toRecord);

    // Fire error event if errors from resource
    this.post.call( this, act, function( err, res, qry ) {
      if ( err ) this.emit( 'error', qry, err );
    });

  }, this );


  /**
   * Internal pointer to any instanced adapter (Set with `.useAdapter()`)
   *
   * @type {Adapter}
   * @see https://github.com/mekanika/adapter
   */

  this.adapter = adapter;
}


/**
 * Provide description of accessor for each schema: `schema( name )`
 *
 * @return {String} "schema( name )"
 */

Schema.prototype.toString = function() {
  return 'schema(\''+this.identity+'\')';
};


/**
 * Getter/Setter for Schema# options
 *
 * @param {Object|String} [options] Object to set, String to retrieve specific, empty to retrieve all
 * @param {Mixed} [value] Sets the option value if first parameter is a String
 *
 * @return {Object|Mixed} Returns either all options or specific option value
 */

Schema.prototype.options = function( options, value ) {

  // Initialise internal options cache if not existent
  this.__opt = this.__opt || {};

  // Return options if nothing passed
  if (!options) return this.__opt;

  // Get (and set) specified option path
  if (typeof options === 'string') {
    if (typeof value !== 'undefined') this.__opt[ options ] = value;
    return this.__opt[ options ];
  }

  // Otherwise apply options object
  for (var key in options) {
    if (options.hasOwnProperty( key )) {
      this.__opt[ key ] = options[ key ];
    }
  }

  // And return newly set
  return this.__opt;
};


/**
 * Update the resource reference key
 *
 * @param {String} newKey
 * @return {Schema} This Schema#
 */

Schema.prototype.updateKey = function( newKey ) {
  this.key = newKey;
  return this;
};


/**
 * Compose query as `Schema.prototype.query()` with preset Schema properties
 */

Schema.prototype.query = function() {
  // Set the `resource` to query as the current Schema#key
  var _query = query().from( this.key );

  // Fold in an adapter if one is provided
  if ( this.adapter ) _query.useAdapter( this.adapter );

  // Apply schema middleware to the query
  _query.middleware.pre = this._pre;
  _query.middleware.post = this._post;

  return _query;
};


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
  if (!stack[ event ]) stack[ event ] = [];

  // Fold in reference to `this` Schema# in the middleware `fn`
  function _fn() {
    var self = this;
    return function() {
      return fn.apply( self, arguments );
    };
  }

  stack[ event ].push( _fn.call( this ) );
  return this;
}


/**
 * Delegation method to setup pre middleware to the Schema#query()
 *
 * @param {String} event The name of the event to apply middleware on
 * @param {Function} fn The method to run, passed ( Query# )
 *
 * @return {this}
 */

Schema.prototype.pre = function( event, fn ) {
  middleware.call( this, this._pre, event, fn );
};


/**
 * Delegation method to setup post middleware to the Schema#query()
 *
 * @param {String} event The name of the event to apply middleware on
 * @param {Function} fn The method to run, passed ( err, res )
 *
 * @return {this}
 */

Schema.prototype.post = function( event, fn ) {
  middleware.call( this, this._post, event, fn );
};


/**
 * Convert a result (results array) to Records of Schema# if data types match
 *
 * @param {Object|Object[]} res The data object or objects[] to convert
 *
 * @return The result as a Record of this schema, or the raw data
 */

Schema.prototype.toRecord = function( res ) {

  var err
    , isMiddleware = arguments.length > 1;

  // Middleware? Setup err AND res correctly:
  if ( isMiddleware ) {
    err = arguments[0];
    res = arguments[1];
    if (err !== null) return [err, res];
  }

  var self = this;

  function _convert( obj ) {
    // Middleware can no-op and passthrough data if not an object
    if (isMiddleware)
      if (typeof obj !== 'object' || obj instanceof Array) return obj;

    var rp = self.getRequiredPaths();
    // Attempt to verify data obj has at least the required properties
    var match = true;
    for (var i=0; i < rp.length; i++)
      if ( !obj[ rp[i] ] ) { match = false; continue; }

    // Return empty schema cast if no data provided and no required props
    if (obj === undefined && match) return self.new();

    // Error if data object was defined but does not match required props
    if (!match) throw new Error('Convert to schema failed');

    // Cast: create a new record based on the passed data
    return self.new( obj );
  }

  // MUST clear undefined keys from results or will get cast
  // errors when trying to assign 'undefined' to schema properties
  res = res instanceof Array
    ? utils.clean(res).map( _convert, this )
    : _convert( utils.clean(res) );

  return isMiddleware ? [ err, res ] : res;

};


/**
 * Set an explicit adapter to use with this schema
 *
 * Updates an internal pointer to a given `adapter`, used by `Schema.prototype.query()`
 *
 * @param {Adapter} adapter An Adapter# instance
 *
 * @return {Schema} This schema
 */

Schema.prototype.useAdapter = function( adapter ) {
  // Ensure we have an approximately valid adapter
  var adapterError = new Error( 'Schema#adapter must supply valid adapter');
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

Schema.prototype.path = function( key ) {
  var len = this.properties.length;

  while ( len-- ) {
    if ( this.properties[ len ].key === key )
      return this.properties[ len ];
  }

  return undefined;
};


/**
 * Schema properties returned as flat array
 *
 * @return {Array}
 */

Schema.prototype.getPaths = function() {
  var len = this.properties.length,
    ps = [];

  while ( len -- )
    ps.push( this.properties[len].key );

  return ps;
};


/**
 * Schema required properties returned as flat array
 *
 * @return {Array}
 */

Schema.prototype.getRequiredPaths = function() {
  var p = this.properties,
      len = p.length,
      rp = [];

  while ( len -- )
    if ( p[ len ].required() ) rp.push( p[ len ].key );

  return rp;
};


/**
 * Add instance properties to Records
 *
 * @param {String} key
 * @param {Object} [options]
 *
 * @return {Schema}
 */

Schema.prototype.prop = function( key, options ) {
  var len = this.properties.length;

  // Bail out (noop) if this property key is already set
  while( len-- )
    if ( key === this.properties[ len ].key ) return this;

  if (options && options.type) {
    // Normalise native and 'special' types to lowercase string
    var nml = utils.normaliseType( options.type );
    if (nml) options.type = nml;

    // Otherwise check that it's a schema
    else {
      var _s = require('./index');
      if (!_s.has( options.type ))
        throw new Error('Cannot find schema: '+options.type);
      else options.type = _s( options.type );
    }

  }

  this.properties.push( new Property( key, options, type ) );
  return this;
};


Schema.prototype.property = Schema.attr = Schema.prototype.prop;


/**
 * Shortcut method to validate an arbitrary value against a property's rules
 *
 * @param {String} property The property key
 * @param {Mixed} value
 *
 * @return {Array} of errors (empty if none)
 */

Schema.prototype.validate = function (property, value) {
  var p = this.path( property );
  if (!p) throw new Error('No such property defined: '+property);

  return p.validate( value );
};


/**
 * Add prototype methods on Records
 *
 * @param {String} methodName An identifier for the method
 * @param {Function} fn The Function defining the method
 *
 * @return {Schema}
 */

Schema.prototype.method = function( methodName, fn ) {
  if (!methodName || !fn)
    throw new Error('Must define both `methodName` and `fn`');

  if (typeof methodName !== 'string')
    throw new Error('`methodName` must be a String');

  if (typeof fn !== 'function')
    throw new Error('`fn` must be a Function');

  this.methods.push( {key:methodName, fn:fn} );
  return this;
};


/**
 * Applies a static method to the Schema# instance
 *
 * @param {String} methodName An identifier for the method
 * @param {Function} fn The Function defining the method
 *
 * @return {Schema}
 */

Schema.prototype.static = function( methodName, fn ) {
  this[ methodName ] = fn;
  return this;
};


/**
 * Instance a new record based on this Schema
 *
 * @param {Object} attributes An object of property key:values
 *
 * @return {Record} A new record with populated attributes
 */

Schema.prototype.new = function( attributes ) {
  if (typeof Record === 'undefined') throw new Error('No Record class');
  else return new Record( this, attributes );
};


