/**
  @namespace rules
*/


/**
 * Expose module
 */

module.exports = exports;


/**
 * Ensure the value is set (and not undefined)
 *
 * @param {Mixed} val The value to test
 * @return {Boolean}
 * @memberOf rules
 * @alias required
 */

exports.required = function required( val ) {
  return val === undefined || val === null || val === ''
    ? false
    : true;
};


/**
 * Minimum string length
 *
 * @param {String} val The value to test
 * @return {Boolean}
 * @memberOf rules
 * @alias minLength
 */

exports.minLength = function minLength( str, min ) {
  return str.length >= min;
};


/**
 * Maximum string length
 *
 * @param {String} val The value to test
 * @return {Boolean}
 * @memberOf rules
 * @alias maxLength
 */

exports.maxLength = function maxLength( str, max ) {
  return str.length <= max
};


/**
 * Maximum number value
 *
 * @param {Number} val The value to test
 * @param {Number} limit The maximum condition
 * @return {Boolean}
 * @memberOf rules
 * @alias max
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
 * @memberOf rules
 * @alias min
 */

exports.min = function min( val, limit ) {
  return val >= limit;
};


/**
 * Present in a list of values (whitelist)
 * Also works passing in list values as arguments
 *
 * @param {Number} v The value to test
 * @param {Number} limit The list of values to test against
 * @return {Boolean}
 * @memberOf rules
 * @alias in
 */

exports.in = function (v, list) {
  // Check against an array
  if (list instanceof Array) return list.indexOf(v) > -1;
  // Check against a list of arguments
  else return Array.prototype.slice.call(arguments, 1).indexOf(v) > -1;
};


/**
 * Not present in a list of values (blacklist)
 * Also works passing in list values as arguments
 *
 * @param {Number} v The value to test
 * @param {Number} limit The list of values to test against
 * @return {Boolean}
 * @memberOf rules
 * @alias notIn
 */

exports.notIn = function () {
  return !exports.in.apply( this, arguments );
};


/**
 * String is a valid email
 *
 * @param {String} str
 * @return {Boolean}
 * @memberOf rules
 * @alias isEmail
 */

exports.isEmail = function isEmail( str ) {
  return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test( str );
};


/**
 * String is a valid URL
 *
 * @param {String} str
 * @return {Boolean}
 * @memberOf rules
 * @alias isUrl
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
 * @memberOf rules
 * @method is
 * @alias regex
 */

exports.match = function regex( str, exp, flags ) {
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
 * @memberOf rules
 * @method not
 * @alias notRegex
 */

exports.notMatch = function notRegex( str, exp, flags ) {
  return !exports.match( str, exp, flags );
};
