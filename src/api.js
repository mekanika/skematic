
/**
  Data structure and rule validation engine
  @module Skematic

  @example
  import Skematic from 'skematic'
*/

const format = require('./format')
const validate = require('./validate').validate

function Skematic (model, opts = {}) {
  return {
    format: (data, o2) => {
      const conf = o2 ? Object.assign({}, opts, o2) : opts
      return format(model, data, conf)
    },
    validate: (data, o2) => {
      const conf = o2 ? Object.assign({}, opts, o2) : opts
      return validate(model, data, conf)
    }
  }
}

Skematic.format = format
Skematic.validate = validate

module.exports = Skematic
