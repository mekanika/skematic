
import Skematic from '../api'

export function validate (model, opts = {}) {
  return function SkematicValidate (ctx, next) {
    const data = ctx.request.body
    const out = Skematic.validate(model, data, opts)
    ctx.state[opts.validateField || 'validated'] = out
    return next()
  }
}

export function format (model, opts = {}) {
  return function SkematicFormat (ctx, next) {
    const data = ctx.request.body
    const out = Skematic.format(model, data, opts)
    ctx.state[opts.formatField || 'formatted'] = out
    return next()
  }
}
