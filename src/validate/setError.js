
import is from '../is'

/**
  Creates an Error message to be returned to caller. Defaults to a basic
  error message, that can get overridden by `schema.errors`

  @param {Object} schema The schema related to this error
  @param {String} key The field on the schema that has errored
  @param {Array} errs An array of existing errors

  @return {Array} Copy of new errors array
  @private
*/

export default function setError (schema, key, errs) {
  let msg = `Failed: ${key}`
  let errCopy = errs.slice()

  // Attempt to override default message if `.errors` config provided on schema
  if (schema.errors) {
    if (is.string(schema.errors)) msg = schema.errors
    else if (schema.errors[key]) msg = schema.errors[key]
    else if (schema.errors.default) msg = schema.errors.default
  }

  errCopy.push(msg)
  return errCopy
}
