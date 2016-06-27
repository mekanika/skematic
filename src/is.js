
var toType = obj =>
  ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()

var is = {
  string: v => typeof v === 'string',
  integer: v => typeof v === 'number' && v % 1 === 0 && !isNaN(v),
  number: v => toType(v) === 'number' && !isNaN(v),
  array: v => toType(v) === 'array',
  boolean: v => toType(v) === 'boolean',
  object: v => toType(v) === 'object',
  date: v => toType(v) === 'date',
  function: v => toType(v) === 'function',
  undefined: v => typeof v === 'undefined',
  error: v => toType(v) === 'error',
  equal: (a, b) => {
    if (a === b) return true
    let i = -1

    if (is.array(a)) {
      if (!is.array(b)) return false
      if (a.length !== b.length) return false
      while (++i < a.length) {
        if (!is.equal(a[i], b[i])) return false
      }

      return true
    }

    if (is.object(a) && is.object(b)) {
      let aKeys = Object.keys(a)
      let bKeys = Object.keys(b)

      if (aKeys.length !== bKeys.length) return false

      while (++i < aKeys.length) {
        if (!is.equal(a[aKeys[i]], b[aKeys[i]])) return false
      }

      return true
    }
    return false
  }
}

/**
  Returns the raw type of the element

  @param {Mixed} el The element to return the type from
*/

is.type = el => toType(el)

module.exports = is
