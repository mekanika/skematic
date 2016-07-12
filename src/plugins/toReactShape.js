
const mapToPropType = (PropTypes, type) => {
  switch (type) {
    // @todo Add support for:
    //   - Arrays
    //   - Objects (sub-schema)

    case 'boolean':
      return PropTypes.bool

    case 'string':
    case 'text':
      return PropTypes.string

    case 'integer':
    case 'float':
    case 'decimal':
    case 'number':
      return PropTypes.number

    default:
      if (type) {
        console.log('[mapToPropType] No map for type: ' + type)
      }
      return PropTypes.any
  }
}

/**
  Converts a Skematic model into a React PropTypes validation object
  @see https://facebook.github.io/react/docs/reusable-components.html

  @param {Object} model The Skematic data model
  @param {Object} PropTypes The React.PropTypes setter

  @return {Object} A mapped propTypes object to attach to React components
*/

module.exports = function toReactShape (model, PropTypes) {
  let shape = {}

  for (let key in model) {
    const field = model[key]

    shape[key] = mapToPropType(PropTypes, field.type)

    // Enforce .isRequired for fields that disable allowNull
    if (field.required || field.allowNull === false) {
      shape[key] = shape[key].isRequired
    }
  }

  return PropTypes.shape(shape)
}
