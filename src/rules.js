/**
  @namespace Rules
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
 * @memberOf Rules
 * @alias required
 */

exports.required = function required( val ) {
  return val === undefined || val === null || val === ''
    ? false
    : true;
};


/**
 * Value is empty (either `''` or `undefined`).
 *
 * Set `allowEmpty=false` to return `false` on empty, `true` on set
 *
 * @param {Mixed} val The value to test
 * @param {Boolean} allowEmpty [default:true] When `false`, empty values return `false`, set values return `true`
 * @return {Boolean}
 * @memberOf Rules
 * @alias empty
 */

exports.empty = function (v, allowEmpty) {
  if (typeof allowEmpty === 'undefined') allowEmpty = true;
  return (v === '' || v === undefined) && allowEmpty;
};


/**
 * Minimum string length
 *
 * @param {String} val The value to test
 * @return {Boolean}
 * @memberOf Rules
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
 * @memberOf Rules
 * @alias maxLength
 */

exports.maxLength = function maxLength( str, max ) {
  return str.length <= max;
};


/**
 * Maximum number value
 *
 * @param {Number} val The value to test
 * @param {Number} limit The maximum condition
 * @return {Boolean}
 * @memberOf Rules
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
 * @memberOf Rules
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
 * @memberOf Rules
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
 * @memberOf Rules
 * @alias notIn
 */

exports.notIn = function () {
  return !exports.in.apply( this, arguments );
};


/**
  Checks that a provided array contains the value `val`

  @param {Array} arr The array to inspect for presence of `val`
  @param {Mixed} val The value to find
  @memberOf Rules
  @alias has
*/

exports.has = function has (arr, val) {
  return arr.indexOf(val) > -1;
};


/**
  Checks that a provided array DOES NOT contain the value `val`

  @param {Array} arr The array to inspect for presence of `val`
  @param {Mixed} val The value to find
  @memberOf Rules
  @alias hasNot
*/

exports.hasNot = function hasNot (arr, val) {
  return arr.indexOf(val) === -1;
};


/**
 * String is a valid email
 *
 * @param {String} str
 * @return {Boolean}
 * @memberOf Rules
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
 * @memberOf Rules
 * @alias isUrl
 */

exports.isUrl = function isUrl( str ) {
  //A modified version of the validator from @diegoperini / https://gist.github.com/729294
  return str.length < 2083 && (/^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i).test( str );
};


/**
 * String is alpha characters
 *
 * @param {String} str
 * @return {Boolean}
 * @memberOf Rules
 * @alias isAlpha
 */

exports.isAlpha = function (v) {
  return (/^[a-zA-Z]+$/i).test(v);
};


/**
 * String is alphaNumeric characters
 *
 * @param {String} str
 * @return {Boolean}
 * @memberOf Rules
 * @alias isUrl
 */

exports.isAlphaNum = function (v) {
  return (/^[a-zA-Z0-9]+$/i).test(v) && typeof(v) === 'string';
};


/**
 * String matches Regex `exp`
 *
 * @param {String} str
 * @param {Regex|String} exp A regular expression to test (converted to RegExp if string)
 * @param {String} [flags] to apply to regex (eg. "ig")
 * @return {Boolean}
 * @memberOf Rules
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
 * @memberOf Rules
 * @method not
 * @alias notRegex
 */

exports.notMatch = function notRegex( str, exp, flags ) {
  return !exports.match( str, exp, flags );
};
