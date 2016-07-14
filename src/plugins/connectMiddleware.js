
import Skematic from '../api'

export function validate (model, opts = {}) {
  return function SkematicValidate (req, res, next) {
    const data = req.body
    const out = Skematic.validate(model, data, opts)
    req[opts.validateField || 'validated'] = out
    return next()
  }
}

export function format (model, opts = {}) {
  return function SkematicFormat (req, res, next) {
    const data = req.body
    const out = Skematic.format(model, data, opts)
    req[opts.formatField || 'formatted'] = out
    return next()
  }
}
