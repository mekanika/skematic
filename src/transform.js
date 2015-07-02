
/**
  Dependencies
  @ignore
*/

import * as Cast from './typeconvert';

/**
  Export transform modules
  @ignore
*/

export default transform;

/**
  Available transform functions (modifiers for value)
  @namespace Transforms
*/

const _transforms = {

  /**
    Remove whitespace from start and end of string

    @param {String} str
    @return {String} Trimmed string
    @memberOf Transforms
  */
  trim: v => v.trim(),

  /**
    Removes ALL whitespace from string

    @param {String} str
    @return {String} No whitespaced string
    @memberOf Transforms
  */

  nowhite: v => v.replace(/ /g, ''),

  /**
    Convert a string to all uppercase

    @param {String} str
    @return {String} Uppercased string
    @memberOf Transforms
  */

  uppercase: v => v.toUpperCase(),

  /**
    Convert a string to all lowercase

    @param {String} str
    @return {String} Lowercased string
    @memberOf Transforms
  */

  lowercase: v => v.toLowerCase()
};

// Add 'to$CAST' casters to transforms
for (var cast in Cast) {
  if (cast.substr(0, 2) === 'to') _transforms[cast] = Cast[cast];
}

/**
  Applies a list of transform functions

  @param {Mixed} val The value to transform
  @param {String[]} transforms Array of named transforms to apply

  @throws {Error} if transform cannot be applied
  @return {Mixed} The transformed value

  @memberOf Format
  @alias transform
*/

function transform (val, transforms) {
  // No-op if no transforms
  if (!transforms) return val;

  // Do not attempt to transform 'undefined' values
  if (val === undefined) return val;

  // Ensure transforms are provided as an array
  if (typeof transforms === 'string') transforms = [transforms];

  for (let i = 0; i < transforms.length; i++) {
    let key = transforms[i];
    // Try-catch is to make it CLEAR that this can throw
    // May be useful in future to do more than propagate throw
    try {
      // @note this will silently fail if no transform is found...
      if (_transforms[key]) val = _transforms[key](val);
    } catch(e) {
      throw e;
    }
  }

  return val;
}

/**
  Exposes the available transforms as an array

  @return {Array}
*/

transform.available = () => Object.keys(_transforms);

/**
  Adds a named `key` transform `fn`

  @param {String} key The identifier for the transform
  @param {Function} fn The transform function (passed `v` and returns modified `v`)
*/

transform.add = (key, fn) => _transforms[ key ] = fn;
