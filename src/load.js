/**
 * Module dependencies
 * @private
 */

var schema = require('../index');


/**
 * Expose module
 */

module.exports = exports = load;


/**
 * Loads a schema configuration description as a Schema instance
 *
 * @param {Object|JSON} o A schema config as an Object or JSON object
 *
 * @return {Schema}
 * @method load
 */

function load( o ) {

  // @todo replace TEMPORARY Event handler stub
  var __fn = function(){};
  var events = {warn:__fn, error:__fn};

  // Convert JSON obj to JS object
  try {
    o = typeof o === 'string'
      ? JSON.parse( o ) : o;
  }
  catch( e ) {
    events.error( {msg:'Could not convert from JSON object', data:o} );
    throw e;
  }

  // Halt loading if passed data is not an object at this point
  if ( o.constructor.name !== 'Object' ) {
    var err = 'Failed to load data as an Object';
    events.error( {msg:err, data:o} );
    throw new Error( err );
  }

  // Generate a random key if one is not provided. This is kinda lame.
  // @todo no key or no identity? FAIL ME.
  // @note why are key and identity different? in app models.. this is overkill.
  if (!o.key) {
    o.key = Math.random().toString(36).substr(2);
    events.warn( {msg:'No key provided. Generating: '+o.key, data:o} );
  }

  // @tmp "OR key" is only relevant until we validate all MUST have identity
  var _m = schema.new( o.identity || o.key );

  // Add any properties to the schema
  if (o.properties) _m = addProperties( o.properties, _m );

  // Add any methods to the schema
  if (o.methods) _m = addMethods( o.methods, _m );

  return _m;
}


/**
 * Steps through properties and adds them to the schema model
 *
 * @prop {Array} props
 * @prop {Schema} schemaRef A schema instance
 *
 * @return {Schema} the updated schema instance
 * @private
 */

function addProperties( props, schemaRef ) {

  props.forEach( function( prop ) {
    var key = prop.key;

    // Check if "simple" property declaration "{$key:$def}"
    if (!key) {
      key = Object.keys( prop )[0];

      // Functions should get added to schema#methods
      if (typeof prop === 'function') return schemaRef.method( key, prop );

      // Check the value is not a "string"-ed function
      if (/^\s*?function.*\(/.test( prop[ key ] )) {
        try {
          // Embedded string "function(...){...}" - add to methods
          return schemaRef.method( key, makeFunction( prop[key] ) );
        }
        catch ( e ) { throwConvertError( e ); }
      }
      // Simple property ($key:'$type')
      else return schemaRef.prop( key, {type:prop[key]} );
    }

    // Complex property (key:{Object})
    var opts = {};
    for (var ik in prop) {
      var val = prop[ik];
      var convertedVal = val;

      if (val instanceof Array) {
        var _a = [];

        val.forEach( function(el) {
          if (/^\s*?function.*\(/.test( el )) {
            try {
              // Embedded string "function(...){...}" - add to methods
              return _a.push( makeFunction( el ) );
            }
            catch ( e ) { throwConvertError( e ); }
          }
          else {
            if (ik === 'rules') el.rule = makeFunction( el.rule );

            _a.push( el );
          }
        });
        convertedVal = _a;
      }

      opts[ ik ] = convertedVal;
    }

    // Apply the property to the schema
    schemaRef.prop( key, opts );

  });

  return schemaRef;
}


/**
 * Applies declared methods to a schema instance
 *
 * @prop {Array} methods
 * @prop {Schema} schemaRef A schema instance
 *
 * @return {Schema} the uppdated schema instance
 * @private
 */

function addMethods( methods, schemaRef ) {

  methods.forEach( function( mblock ) {
    var method = mblock.fn;
    var key = mblock.key;

    if (typeof method === 'function') return schemaRef.method( key, method );

    // Strip function string to fn contents (no function(...) boilerplate)
    try {
      // Otherwise check we're dealing with a string:
      if (typeof method !== 'string') throw new Error('Not a string');
      method = makeFunction( method );
    }
    catch ( e ) { throwConvertError( e ); }

    schemaRef.method( key, method );

  });

  return schemaRef;
}


/**
 * Converts a string function into a JS Function
 *
 * @param {String} str A string representation of a fn "function(...) {...}"
 *
 * @return {Function}
 * @private
 */

function makeFunction( str ) {
  var args = [];

  // Is this wrapped in a 'function()' declaration
  if (/^\s*?function/.test( str ) ) {
    // Extract arguments list from `function( ... )`
    args = /\(([^\)]*).*\)/.exec( str )[1];
    // Convert to an array
    args = args.trim().replace( /\s/g, '' ).split(',');
    // Add the function content body to the args array (for `Function`)
    args.push( /function.*\{\s?([\S*\s*]*)\}/.exec( str )[1] );
  }
  else throw new Error('Must declare string as `function()...');

  return Function.apply( this, args );
}



/**
 * Wrapper function that throws a preformatted conversion error
 *
 * @throws Conversion error
 * @private
 */

function throwConvertError( e ) {
  e || ( e = new Error('Conversion error') );
  throw new Error( 'Could not convert string to method: '+ e.message );
}
