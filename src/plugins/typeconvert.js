
/**
 * Methods to convert a value to a specific Type
 * @namespace plugins/TypeConvert
 */

module.exports = {
  toString,
  convertNumber,
  toNumber,
  toFloat,
  toInteger,
  toBoolean,
  toDate
}

/**
 * Convert to a string
 *
 * Returns the following conversions:
 *
 *   - undefined -> throws Error
 *   - null     -> null
 *   - string   -> string: 'hi' -> 'hi', '' -> ''
 *   - number   -> string: 1234 -> '1234'
 *   - boolean  -> string: true -> 'true'
 *   - function -> string: function(a){} -> 'function(a){}'
 *   - Date     -> string: new Date() -> 'Thu Nov 21 2013 15:29:36 GMT+0800 (WST)'
 *   - object   -> string: {a:1, b:{c:'2'}} -> '{"a":1, "b":{"c":"2"}}' (JSON)
 *   - array    -> string: [1,'2',three] -> '1,2,three'
 *
 *
 * @param {Mixed} val to convert
 *
 * @throws Conversion failure error
 * @returns {String} converted value
 * @alias toString
 * @memberof plugins/TypeConvert
 */

function toString (val) {
  if (val === null) return val

  // Parse if value is not undefined
  if (val !== undefined) {
    // Convert objects with simple JSON.stringify (does not convert methods)
    if (val.constructor && val.constructor.name === 'Object') {
      if (JSON && JSON.stringify) return JSON.stringify(val)
    }

    // Otherwise just try a simple conversion
    if (val.toString) return val.toString()
  }

  throw new Error('Failed to cast to String')
}

/**
 * Convert to a number (optionally integer or float)
 *
 * Returns the following conversions:
 *
 *   - undefined -> throws Error
 *   - null     -> null
 *   - string   -> number || throws. '1234'->1234, 'abcd'->Err, ''->undefined
 *   - number   -> number: 1234 -> 1234
 *   - boolean  -> number: true -> 1 (false -> 0)
 *   - function -> throws Error
 *   - Date     -> throws Error
 *   - object   -> throws Error
 *   - array    -> throws Error
 *
 * @param {Mixed} val to convert
 * @param {Function} [convertor] A format function: Number, parseInt, parseFloat
 * @param {Number} [radix] The base radix to convert parseInt/Float. Default 10
 *
 * @throws Conversion failure error
 * @returns {Number} converted value
 * @alias convertNumber
 * @memberof plugins/TypeConvert
 */

function convertNumber (val, convertor, radix) {
  // Setup defaults
  convertor || (convertor = radix !== undefined ? parseInt : Number)
  radix || (radix = 10)

  if (!isNaN(val)) {
    // Empty values
    if (val === null) return val
    if (val === '') return undefined

    // Already a number? Run it through the convertor and return
    if (val instanceof Number || typeof val === 'number') {
      return convertor(val, radix)
    }

    // Convert booleans
    if (typeof val === 'boolean') {
      return val ? 1 : 0
    }

    // Convert any remaining possibilities
    if (typeof val === 'string') val = convertor(val, radix)
    if (val.toString &&
      !Array.isArray(val) &&
      val.toString() === Number(val)) val = convertor(val, radix)

    // And return if we don't have a NaN
    if (!isNaN(val) && typeof val === 'number') return val
  }

  throw new Error('Failed to cast to Number')
}

/**
 * Convert to a Number
 *
 * @param {Mixed} val to convert
 *
 * @throws Conversion failure error
 * @returns {Number} converted value
 * @alias toNumber
 * @memberof plugins/TypeConvert
 */

function toNumber (val) {
  return convertNumber(val, Number)
}

/**
 * Convert to a float Number
 *
 * Calls .toNumber() with `parseFloat` as convertor
 *
 * @param {Mixed} val to convert
 *
 * @throws Conversion failure error
 * @returns {Number} converted value
 * @alias toFloat
 * @memberof plugins/TypeConvert
 */

function toFloat (val) {
  return convertNumber(val, parseFloat)
}

/**
 * Convert to an integer Number (optional radix to convert to base)
 *
 * Calls .toNumber() with `parseInt` as convertor and optional radix
 *
 * @param {Mixed} val to convert
 * @param {Number} [radix] The base radix to convert parseInt/Float. Default 10
 *
 * @throws Conversion failure error
 * @returns {Number} converted value
 * @alias toInteger
 * @memberof plugins/TypeConvert
 */

function toInteger (val, radix) {
  return convertNumber(val, parseInt, radix)
}

/**
 * Convert to a Boolean
 *
 * Returns the following conversions:
 *
 *   - undefined -> boolean: undefined -> false
 *   - null     -> null
 *   - string   -> boolean: '0' -> false, 'false' -> false, all others -> true
 *   - number   -> boolean: 0 -> false, all other numbers -> true
 *   - boolean  -> boolean
 *   - function -> boolean: all -> true
 *   - Date     -> boolean: all -> true
 *   - object   -> boolean: all -> true
 *   - array    -> boolean: all -> true
 *
 * @param {Mixed} val to convert
 *
 * @returns {Boolean} converted value
 * @alias toBoolean
 * @memberof plugins/TypeConvert
 */

function toBoolean (val) {
  if (val === null) return val
  if (val === '0') return false
  if (val === 'true') return true
  if (val === 'false') return false
  return !!val
}

/**
 * Convert to an ISO 8601 Date format
 *
 * Returns the following conversions:
 *
 *   - undefined -> throws Error
 *   - null     -> null
 *   - string   -> Date || throws Error: '1234' -> Date#, 'abcd' -> Error
 *   - number   -> Date: 1234 -> Date# (equiv to `new Date(1234)`)
 *   - boolean  -> throws Error
 *   - function -> throws Error
 *   - Date     -> Date
 *   - object   -> throws Error
 *   - array    -> throws Error
 *
 * @param {Mixed} val to convert
 *
 * @throws Conversion failure error
 * @returns {String} ISO 8601 formatted date
 * @alias toDate
 * @memberof plugins/TypeConvert
 */

function toDate (val) {
  if (val === undefined || val instanceof Array) {
    throw new Error('Failed to cast to Date')
  }
  if (val === null || val === '') return null
  if (val instanceof Date) return val.toISOString()

  var date

  // support for timestamps
  if (val instanceof Number ||
      typeof val === 'number' ||
      String(val) === Number(val)) {
    date = new Date(Number(val)).toISOString()
  } else if (val && val.toString) {
    // support for date strings
    date = new Date(val.toString()).toISOString()
  }

  if (date && (new Date(date)).toString() !== 'Invalid Date') return date

  throw new Error('Failed to cast to Date')
}
