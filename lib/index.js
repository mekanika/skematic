
/**
 * Module dependencies
 */

var Cast = require('./cast');


/**
 * Expose module
 */

module.exports = Property;


/**
 * Creates a new Property instance
 *
 * @param {String} key Unique identifier for the property
 * @param {Object} [options]
 * @constructor
 * @public
 */

function Property( key, options ) {

  if (!key || typeof key !== 'string')
    throw new Error('Property( key...) requires a string `key`');

  // Initialise Property attributes
  this.setters = [];
  this.getters = [];

  this.rules = [];

  // Assign passed options
  for (var opt in options) if (typeof this[opt] === 'function') {
      this[opt].call( this, options[opt] );
    }
    else this[ opt ] = options[ opt ];

  // Assign passed values
  this.key = key;
  if (options && options.type) this.type = options.type;

  // Assign a caster function based on type (undefined if none)
  this.caster = _setCaster( options );

  return this;
}


/**
 * Declares a Cast Type function for a given type set
 *
 * @param {String} type The type associated with this Property
 *
 * @returns a cast function or undefined
 * @private
 */

function _setCaster( opts ) {

  if (!opts) return;

  switch( opts.type ) {
    case 'string': return Cast.toString;
    case 'number': return Cast.toNumber;
    case 'integer': return Cast.toInteger;
    case 'float': return Cast.toFloat;
    case 'boolean': return Cast.toBoolean;
    case 'date': return Cast.toDate;
  }

  // Special case arrays
  if (opts.array) return Cast.toAuxArray;

}


/**
 * Applies the property's caster function to the value
 *
 * @param val The value to cast
 *
 * @returns the cast value (or passthrough value if no caster)
 */

Property.prototype.cast = function( val ) {

  return this.caster
    // Only Array caster requires `this.type`
    ? this.caster( val, this.type )
    // Pass through value if property has no cast function
    : val;

};


/**
 * Adds a transform function to `this.setters` array
 *
 * @param {Function} fn A transform function
 *
 * @returns {Property} this
 */

Property.prototype.set = function( fn ) {
  if (typeof fn !== 'function')
    throw new Error('Property#set(fn) requires `fn` to be a function');

  this.setters.push( fn );

  return this;
};


/**
 * Helper method - applies an array of modifier functions to a value
 *
 * @param {Function[]} modifiers An array of modifier methods
 * @param {Mixed} value The value to modify
 *
 * @returns The modified value
 * @private
 */

function _apply( modifiers, val ) {
  for ( var i=0; i < modifiers.length; i++ )
    val = modifiers[ i ]( val );

  return val;
}


/**
 * Transforms a value through the `this.setters` functions
 *
 * Each of the setter modifiers in `this.setters` is applied sequentially,
 * each modifying the output of the previous transform.
 *
 * @param {Mixed} value The value to be modified by the setters
 *
 * @returns {modifiedValue} The transformed value
 */

Property.prototype.applySetters = function( value ) {
  return _apply( this.setters, value );
};


/**
 * Adds a transform function to `this.getters` array
 *
 * @param {Function} fn A transform function
 *
 * @returns {Property} this
 */

Property.prototype.get = function( fn ) {
  if (typeof fn !== 'function')
    throw new Error('Property#get(fn) requires `fn` to be a function');

  this.getters.push( fn );

  return this;
};


/**
 * Transforms a value through the `this.getters` functions
 *
 * Each of the setter modifiers in `this.getters` is applied sequentially,
 * each modifying the output of the previous transform.
 *
 * @param {Mixed} value The value to be modified by the setters
 *
 * @returns {modifiedValue} The transformed value
 */

Property.prototype.applyGetters = function( value ) {
  return _apply( this.getters, value );
};


/**
 * Setter/getter for defaultValue of the property
 *
 * @param {String|Boolean|Number} [value] The defaultValue to apply
 * @returns {defaultValue|Property} Returns defaultValue on get, Property on set
 */

Property.prototype.default = function( value ) {
  return arguments.length
    ? (this.defaultValue = value, this)
    : this.defaultValue;
};


/**
 * Setter/getter for isRequired validator of the property
 *
 * @param {Boolean} [isRequired] Flag specifying whether property is required
 * @returns {isRequired|Property} On get, isRequired; otherwise `this`
 */

Property.prototype.required = function( isRequired ) {

  var requiredValidator = function (val) {
    return val === undefined
      ? false
      : true;
  };

  if (!arguments.length) return this.isRequired;

  this.isRequired = isRequired ? true : false;

  // Remove the required validator if not required
  if (isRequired === false) {
    var len = this.rules.length;
    while( len-- )
      if (this.rules[len].rule === requiredValidator)
        this.rules.splice( len, 1 );
  }
  // Otherwise apply the validator
  else
    this.addValidator( requiredValidator, 'Property is required' );

  return this;
};


/**
 * Adds a validation rule to the Property stack
 *
 * Validators are functions that are passed a value, and return a Boolean
 * true or false based on that `value`. Any non-true return value is treated
 * as falsey.
 *
 * @param {Function} rule The validator, passed a value, returns Boolean
 * @param {String} [errorMsg] Optional error message to associate with rule
 * @param {Array} [args] Optional values to pass as arguments to the validator
 * @returns {Property} this
 */

Property.prototype.addValidator = function( rule, errorMsg, args ) {

  // No-op if no rule is provided
  if (!rule) return this;

  var vals = this.rules
    , len = vals.length
    , found = 0;

  // Ensure this rule has not already been added
  while( len-- )
    if (vals[len].rule === rule) found = len+1;

  if (found) return this;

  // Otherwise, add the validator to the stack
  errorMsg || (errorMsg = 'Validation failed');
  this.rules.push({
    rule: rule,
    msg: errorMsg,
    args: args instanceof Array ? args : [args]
  });

  return this;
};


/**
 * Options method to set an array of validators to Property
 *
 * @param {Array} vArr Array of validators `{rule:fn, errorMsg:msg, limits:[args]}`
 * @returns {this}
 */

Property.prototype.validators = function( vArr ) {
  if (!arguments.length) return this.rules;

  vArr.forEach( function( v ) {

    this.addValidator(
        v.rule
      , v.errorMsg
      , v.limits || v.args || v.conditions || undefined );

  }, this );

  return this;
};


/**
 * Runs all the validators against passed `value` returns array of errors
 *
 * `errors` array is left empty if no errors are raised on validation
 *
 * @param {Mixed} value The value to test validators against
 * @returns {Array} errors
 */

Property.prototype.validate = function( value ) {

  if (!arguments.length)
    throw new Error('Property#validate(value) requires a `value` to be passed');

  var validator
    , len = this.rules.length
    , errors = [];

  while ( len-- ) {
    validator = this.rules[ len ];

    // Build up arguments array to apply to validator
    var args = [value];
    if (validator.args && validator.args.length)
      args = args.concat( validator.args );

    validator.rule.apply( this, args )
      ? true : errors.push( validator.msg );
  }

  return errors;
};
