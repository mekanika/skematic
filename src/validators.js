
/**
 * Expose module
 */

module.exports = exports;


/**
 * Ensure the value is set (and not undefined)
 *
 * @param {Mixed} val The value to test
 * @return {Boolean}
 */

exports.required = function required( val ) {
  return val === undefined || val === null || val === ''
    ? false
    : true;
};


/**
 * Evaluates if a string length is between `min` and `max`
 *
 * @param {String} str
 * @param {Number} min
 * @param {Number} max
 * @return {Boolean}
 */

exports.betweenLength = function betweenLength( str, min, max ) {
  return str.length >= min && (max === undefined || str.length <= max);
};


/**
 * Minimum string length
 *
 * @param {String} val The value to test
 * @return {Boolean}
 */

exports.minLength = function minLength( str, limit ) {
  return exports.betweenLength( str, limit );
};


/**
 * Maximum string length
 *
 * @param {String} val The value to test
 * @return {Boolean}
 */

exports.maxLength = function maxLength( str, limit ) {
  return exports.betweenLength( str, 0, limit );
};


/**
 * Number range (inclusive)
 *
 * @param {String} val The value to test
 * @param {Number} min
 * @param {Number} max
 * @return {Boolean}
 */

exports.between = function between( val, min, max ) {
  return val >= min && val <= max;
};


/**
 * Maximum number value
 *
 * @param {Number} val The value to test
 * @param {Number} limit The maximum condition
 * @return {Boolean}
 */

exports.max = function max( val, limit ) {
  return val <= limit;
};


/**
 * Minimum number value
 *
 * @param {Number} val The value to test
 * @param {Number} limit The minimum condition
 * @return {Boolean}
 */

exports.min = function min( val, limit ) {
  return val >= limit;
};


/**
 * String is a valid email
 *
 * @param {String} str
 * @return {Boolean}
 */

exports.isEmail = function isEmail( str ) {
  return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test( str );
};


/**
 * String is a valid URL
 *
 * @param {String} str
 * @return {Boolean}
 */

exports.isUrl = function isUrl( str ) {
  //A modified version of the validator from @diegoperini / https://gist.github.com/729294
  return str.length < 2083 && (/^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i).test( str );
};


/**
 * String matches Regex `exp`
 *
 * @param {String} str
 * @param {Regex|String} exp A regular expression to test (converted to RegExp if string)
 * @param {String} [flags] to apply to regex (eg. "ig")
 * @return {Boolean}
 */

exports.is =
exports.regex = function regex( str, exp, flags ) {
  if ( !(exp instanceof RegExp) ) exp = new RegExp( exp, flags );
  return exp.test( str );
};


/**
 * String does NOT match Regex `exp`
 *
 * @param {String} str
 * @param {Regex|String} exp A regular expression to test (converted to RegExp if string)
 * @param {String} [flags] to apply to regex (eg. "ig")
 * @return {Boolean}
 */

exports.not =
exports.notRegex = function notRegex( str, exp, flags ) {
  return !exports.regex( str, exp, flags );
};


// var ErrorMessages = {default:'Val err.chang me'};

// if (!ErrorMessages.default)
//   throw new Error('No default validators error message set');

// // Step through all exported validators and attach error message
// for (var el in exports) {

//   exports[ el ].msg = ErrorMessages[ el ]
//     ? ErrorMessages[ el ]
//     : ErrorMessages.default + ': ' + el;

// }



// -- Array
// .minItems
// .maxItems
// .uniqueItems
// .enum

// -- Any
// .dependencies
