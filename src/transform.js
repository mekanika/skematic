
/**
  Dependencies
  @ignore
*/

import is from './is'
import * as Cast from './plugins/typeconvert'

/**
  Export transform modules
  @ignore
*/

export default transform

/**
  Available transform functions (modifiers for value)
  @namespace Transforms
*/

const _transforms = {

  /**
    Remove whitespace from start and end of string

    @param {String} v
    @return {String} Trimmed string
    @memberof Transforms
  */
  trim: v => v.trim(),

  /**
    Removes ALL whitespace from string

    @param {String} v
    @return {String} No whitespaced string
    @memberof Transforms
  */

  nowhite: v => v.replace(/ /g, ''),

  /**
    Convert a string to all uppercase

    @param {String} v
    @return {String} Uppercased string
    @memberof Transforms
  */

  uppercase: v => v.toUpperCase(),

  /**
    Convert a string to all lowercase

    @param {String} v
    @return {String} Lowercased string
    @memberof Transforms
  */

  lowercase: v => v.toLowerCase()
}

// Add 'to$CAST' casters to transforms
for (var cast in Cast) {
  if (cast.substr(0, 2) === 'to') _transforms[cast] = Cast[cast]
}

/**
  Applies a list of transform functions

  @param {Mixed} val The value to transform
  @param {String[]} transforms Array of named transforms to apply

  @throws {Error} if transform cannot be applied
  @return {Mixed} The transformed value

  @memberof Format
  @alias transform
*/

function transform (val, transforms, parentData) {
  // No-op if no transforms
  if (!transforms) return val

  // Do not attempt to transform 'undefined' values
  if (val === undefined) return val

  // Ensure transforms are provided as an array
  if (!is.array(transforms)) transforms = [transforms]

  for (let i = 0; i < transforms.length; i++) {
    let key = transforms[i]
    // Try-catch is to make it CLEAR that this can throw
    // May be useful in future to do more than propagate throw
    try {
      // Run the transform as a function if provided as such
      if (is.function(key)) val = key.call(parentData, val)
      // Attempt to source the transform from a built-in (see `_transforms`)
      else if (_transforms[key]) val = _transforms[key].call(parentData, val)
      // Otherwise developer has a problem, notify them
      else console.warn('[Skematic] Could not run transform', key)
    } catch (e) {
      throw e
    }
  }

  return val
}

/**
  Exposes the available transforms as an array

  @return {Array}
*/

transform.available = () => Object.keys(_transforms)

/**
  Adds a named `key` transform `fn`

  @param {String} key The identifier for the transform
  @param {Function} fn The transform function (passed `v` and returns modified `v`)
*/

transform.add = (key, fn) => (_transforms[ key ] = fn)
