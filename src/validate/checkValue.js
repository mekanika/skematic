
import is from '../is'
import setError from './setError'
import * as Rules from '../rules'

/**
  Checks a value against the rules defined in `model`

  Does **NOT** apply rules to undefined values that are not `required`

  @param {Mixed} val The value to test
  @param {Object} model The model to apply the tests against
  @param {Object} [data] The parent data object to reference on custom rules

  @return {Array} errors
  @private
*/

export default function checkValue (val, model, data, opts) {
  let errs = []
  if (!model) return []

  //  1. Check null value status
  //
  //           required | req & allowNull | allowNull | !allowNull
  // undefined   fail          fail            pass        fail
  //      null   fail          pass            pass        fail

  // Disallow NOT NULL values
  // Note: '==' equality matches `null` AND `undefined`
  if (val == null && model.allowNull === false) {
    errs = setError(model, 'required', errs)
    return setError(model, 'allowNull', errs)
  }

  // Don't validate `null/undefined` values if not required
  if (val == null && !model.required) return []

  // Allow NULL values (no validations run)
  if (val === null && model.allowNull) return []

  // Bail out if required is present and fails
  // (It's not useful to run the other validations otherwise)
  if (!Rules.required(val) && model.required) {
    return setError(model, 'required', errs)
  }

  // 2. Check type match
  // The value type matches its declaration (if any)
  if (model.type && is[model.type]) {
    if (!is.undefined(val) && !is[ model.type ](val)) {
      return [`Not of type: ${model.type}`]
    }
  }

  // 3. Validate rules
  for (let key in model.rules) {
    if (!model.rules.hasOwnProperty(key)) continue

    let isValid = true

    // If provided a user defined function ALWAYS use this first
    if (is.function(model.rules[key])) {
      try {
        isValid = model.rules[key].call(data, val)
      } catch (e) {
        isValid = false
      }
    } else {
      // Build parameters to pass to rule
      let params = model.rules[key]
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

    if (!isValid) errs = setError(model, key, errs)
  }

  // Return errors
  return errs
}
