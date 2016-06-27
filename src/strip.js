
/**
  Remove fields from data (destructive, ie. modifies `data` directly)

  @param {Mixed|Mixed[]} values The value or array of values to match
  @param {Object} data

  @memberof Format
  @alias strip
*/

export default function strip (values, data) {
  for (var k in data) {
    if (!data.hasOwnProperty(k)) continue

    if (!(values instanceof Array)) values = [values]

    values.forEach(val => data[k] === val && delete data[k])
  }
}
