
/**
  Import rules and type checker
  @ignore
*/

import {isEmpty} from './rules'
import is from './is'

/**
  Sets a default value if specified on empty fields

  Supports passing an object and complex model.

  @param {Mixed} v The value or object to default
  @param {Model} model The associated model to check the default value on

  @return Value or the default value
  @memberof Format
  @alias setDefault
*/

export default function (v, model) {
  if (!model) return v

  const def = function (v, s) {
    // No default, return the value as is
    if (s.default === undefined) return v

    // Return the default if `v` is empty (ie. undefined or '')
    return isEmpty(v) || v === null ? s.default : v
  }

  // Parse objects
  if (v && typeof v === 'object') {
    for (var k in model) {
      if (!is.undefined(model[k].default)) v[k] = def(v[k], model[k])
    }

    return v

  // Or simply return defaulted scalars
  } else return def(v, model)
}
