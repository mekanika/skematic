
/**
 * Expose the module
 * @ignore
 */

export default idMap

/**
 * Defines the property to lookup
 * @ignore
 */

const KEY_NAME = 'primaryKey'

/**
 * Internal helper to retrieve an arbitrary property match from an object hash
 *
 * @param {Model} model
 * @param {String} name The name of the property to match
 *
 * @return {String|undefined} The name of the first field matching the property
 * @private
 */

function _getField (model, name) {
  for (let key in model) {
    if (!model.hasOwnProperty(key)) continue
    if (model[key][name]) return key
  }
}

/**
 * Maps a default id field to a model provided primaryKey field
 *
 * ```js
 * var propModel = {
 *   prop_id: {primaryKey:true},
 *   name: {type:"string"}
 * }
 *
 * // Example default results from data store:
 * var data = [ {_id:"512314", name:"power"}, {_id:"519910", name:"speed"} ]
 *
 * idMap( propModel, data, '_id' )
 * // -> [ {prop_id:"512314", name:"power"}, {prop_id:"519910", name:"speed"} ]
 * ```
 *
 * @param {Model} model The model to apply
 * @param {Array} col The collection array of data objects to map
 * @param {String} idField The name of the provided id field
 *
 * @return {Array} The collection of data mapped id fields
 * @memberof Format
 */

function idMap (model, col, idField) {
  // Load up the primaryKey field from a given model
  let pk = _getField(model, KEY_NAME)

  // No need to replace anything if no primary key
  if (!pk) return col
  // No need to replace anything if primary key field auto-generated
  if (model[pk].generate) return col

  // Step through collection and rename primary key field
  col.forEach(el => {
    el[pk] = el[idField]
    delete el[idField]
  })

  return col
}
