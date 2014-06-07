
/**
 * Dependencies
 */

var Cast = require('./cast');


/**
 * Expose the module
 */

module.exports = exports = AuxArray;


/**
 * Creates an augmented array
 *
 * @param {Array} values
 * @param {Schema} castAs Reference to the schema used to cast array elements
 *
 * @inherits Array
 * @private
 * @constructor
 */

// Dear code junkie, `forceAsObject` is a test HELPER ONLY to drive AuxArray to
// abandon its assignment of __proto__ in situations where it could. Aight?

function AuxArray( values, castAs, forceAsObject ) {

  var arr;

  // Subclassing array sucks ass. @see http://bit.ly/f6CnZU

  // Where .__proto__ is available (node + new browsers)
  if ( !forceAsObject && [].__proto__ ) {
    arr = [];
    arr.__proto__ = AuxArray.prototype;
  }
  // Old browsers can't .__proto__
  // Failing to assign __proto__ means `Array.isArray( this ) === false`
  // Treats AuxArray as an [object Object] rather than [object Array], but
  // with a prototype chain inheriting Array methods.
  // Requires calling Array native methods with .apply( this ). Also requires
  // manually updating the length attributes for any direct updates like .set().
  // Messy, but works.
  else arr = this;

  arr._castAs = castAs;

  arr.push.apply( arr, values );

  return arr;
}


/**
 * Apply prototype inheritance
 */

AuxArray.prototype = [];



/**
 * Converts the passed value as this Array's schema (if any)
 *
 * @param {Mixed}
 *
 * @returns value The value as a schema if present, or passes through the original value
 * @private
 */

AuxArray.prototype._innerCast = function( value ) {

  // No reference to a cast target? Just return the value
  if (!this._castAs) return value;

  // Is this a 'schema'.. try convert
  if (typeof this._castAs !== 'string') return this._castAs.toRecord( value );

  // Otherwise attempt a regular `Cast`
  var castName = 'to'+this._castAs[0].toUpperCase() + this._castAs.slice(1);
  if (Cast[ castName ]) return Cast[ castName ]( value );
  else throw new Error('No cast function for: ' + castName);
};


/**
 * Pushes casted elements onto this Array
 *
 * Wraps Array#push
 *
 * @param {Mixed...}
 *
 * @returns
 */

AuxArray.prototype.push = function() {
  var values = [].map.call( arguments, this._innerCast, this );

  return [].push.apply( this, values );
};


/**
 * Wraps Array#unshift
 */

AuxArray.prototype.unshift = function() {
  var values = [].map.call( arguments, this._innerCast, this );

  return [].unshift.apply( this, values );
};


/**
 * Sets a casted `value` at a given `index`
 *
 * @param {Number} index The index to apply the value
 * @param {Mixed} value The element to cast and save to the index
 *
 * @returns {this}
 */

AuxArray.prototype.set = function( index, value ) {
  this[ index ] = this._innerCast( value );

  // Legacy mode array handler @see constructor for more info
  if ('length' in Object.keys( this )) this.length++;

  return this;
};


/**
 * Returns a native JS Array (console.log helper)
 *
 * @private
 */

AuxArray.prototype.inspect = function() {
  return this.slice();
};

