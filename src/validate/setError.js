
import is from '../is'

/**
  Creates an Error message to be returned to caller. Defaults to a basic
  error message, that can get overridden by `schema.errors`

  @param {Object} schema The schema related to this error
  @param {String} ruleKey The name of the rule that has failed to validate
  @param {Array} errs An array of existing errors

  @return {Array} Copy of new errors array
  @private
*/

export default function setError (schema, ruleKey, errs) {
  let msg = `${ruleKey}`
  let errCopy = errs.slice()

  // Attempt to override default message if `.errors` config provided on schema
  if (schema.errors) {
    if (is.string(schema.errors)) msg = schema.errors
    else if (schema.errors[ruleKey]) msg = schema.errors[ruleKey]
    else if (schema.errors.default) msg = schema.errors.default
  }

  errCopy.push(msg)
  return errCopy
}
