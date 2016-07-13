
import is from '../is'
import setError from './setError'
import * as Rules from '../rules'

/**
  Checks a value against the rules defined in `schema`

  Does **NOT** apply rules to undefined values that are not `required`

  @param {Mixed} val The value to test
  @param {Object} schema The schema to apply the tests against
  @param {Object} [data] The parent data object to reference on custom rules

  @return {Array} errors
  @private
*/

export default function checkValue (val, schema, data) {
  let errs = []
  if (!schema) return []

  //  1. Check null value status
  //
  //           required | req & allowNull | allowNull | !allowNull
  // undefined   fail          fail            pass        fail
  //      null   fail          pass            pass        fail

  // Disallow NOT NULL values
  // Note: '==' equality matches `null` AND `undefined`
  if (val == null && schema.allowNull === false) {
    errs = setError(schema, 'required', errs)
    return setError(schema, 'allowNull', errs)
  }

  // Don't validate `null/undefined` values if not required
  if (val == null && !schema.required) return []

  // Allow NULL values (no validations run)
  if (val === null && schema.allowNull) return []

  // Bail out if required is present and fails
  // (It's not useful to run the other validations otherwise)
  if (!Rules.required(val) && schema.required) {
    return setError(schema, 'required', errs)
  }

  // 2. Check type match
  // The value type matches its declaration (if any)
  if (schema.type && is[schema.type]) {
    if (!is.undefined(val) && !is[ schema.type ](val)) {
      return [`Not of type: ${schema.type}`]
    }
  }

  // 3. Validate rules
  for (let key in schema.rules) {
    if (!schema.rules.hasOwnProperty(key)) continue

    let isValid = true

    // If provided a user defined function ALWAYS use this first
    if (is.function(schema.rules[key])) {
      try {
        isValid = schema.rules[key].call(data, val)
      } catch (e) {
        isValid = false
      }
    } else {
      // Build parameters to pass to rule
      let params = schema.rules[key]
      if (!(params instanceof Array)) params = [params]
      params.unshift(val)

      // Check that the rule exists to run against
      if (!Rules[key]) {
        errs.push(`Unknown rule: ${key}`)
        continue
      }

      // Run defensive validation
      try {
        isValid = Rules[key].apply(this, params)
      } catch (e) {
        isValid = false
      }
    }

    if (!isValid) errs = setError(schema, key, errs)
  }

  // Return errors
  return errs
}
