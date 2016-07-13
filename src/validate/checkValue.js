
import is from '../is'
import setError from './setError'
import * as Rules from '../rules'

/**
  Checks a value against the rules defined in `schema`

  Does **NOT** apply rules to undefined values that are not `required`

  @param {Mixed} val The value to test
  @param {Object} schema The schema to apply the tests against

  @return {Array} errors
  @private
*/

export default function checkValue (val, schema) {
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
  if (schema.type) {
    if (!is[schema.type]) {
      console.warn('[Skematic] Skipping validating unknown type', schema.type)
    } else if (!is.undefined(val) && !is[ schema.type ](val)) {
      return [`Not of type: ${schema.type}`]
    }
  }

  // 3. Validate rules
  for (let key in schema.rules) {
    if (!schema.rules.hasOwnProperty(key)) continue

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
      var isValid = Rules[key].apply(this, params)
    } catch (e) {
      isValid = false
    }

    if (!isValid) errs = setError(schema, key, errs)
  }

  // Return errors
  return errs
}
