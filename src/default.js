
/**
  Import rules and type checker
  @ignore
*/

import {empty} from './rules'
import is from './is'

/**
  Sets a default value if specified on empty fields

  Supports passing an object and complex schema.

  @param {Mixed} v The value or object to default
  @param {Schema} schema The associated schema to check the default value on

  @return Value or the default value
  @memberOf Format
  @alias setDefault
*/

export default function (v, schema) {
  if (!schema) return v

  const def = function (v, s) {
    // No default, return the value as is
    if (s.default === undefined) return v

    // Return the default if `v` is empty (ie. undefined or '')
    return empty(v) || v === null ? s.default : v
  }

  // Parse objects
  if (v && typeof v === 'object') {
    for (var k in schema) {
      if (!is.undefined(schema[k].default)) v[k] = def(v[k], schema[k])
    }

    return v

  // Or simply return defaulted scalars
  } else return def(v, schema)
}
