
import is from './is'

/**
  Determines whether a generator SHOULD be run or not.

  Be very careful passing `undefined` as "val" as this will assume that the
  "val" has been _provided_ as far as the generator flags are concerned. In
  general, DO NOT pass `val` if the value does not exist on your data object.

  @param {Model} model
  @param {Object} opts Options hash. Only contains `once` flag.
  @param {Mixed} [val] Optional value to pass. If passed assumed `provided`.

  @return {Boolean} Passes if all the flags to compute are met

  @private
  @ignore
*/

function canCompute (model, opts = {}, val) {
  if (!model || !model.generate) return false

  // Shorthand
  const gen = model.generate

  const runOnce = opts ? opts.once : false

  // Skip if there is no generator
  if (!gen) return false

  // Run if `gen` is a function
  if (is.function(gen)) return true

  // Has a value been provided by the caller
  const provided = arguments.length > 2

  const preserve = gen.preserve
  const require = gen.require
  const once = gen.once

  // Don't generate on the following conditions
  if (once && !runOnce) return false
  if (provided && preserve) return false
  if (require && !provided) return false

  return true
}

/**
  Computes a single value (rather than stepping through a data object).
  Used directly by 'format' to enable single pass data modification, rather
  than having to run 2 passes (one for computeAll, one for format).

  Checks whether compute is valid (ie. should run) for this model, and either
  returns the computed value or the passed value.

  Flags for processing generate configuration:

  - preserve: If a value is provided DO NOT regenerate, OVERRIDES every
  - require: Regenerate ONLY WHEN a key is provided (ie. require a provided key)
  - once: Only run if 'computeValue' is passed `{once:true}`

  @param {Model} model
  @param {Object} opts Options hash. Only contains `once` flag.
  @param {Mixed} [val] Optional value to pass

  @return {Mixed} The computed value (if any) or the passed `val`

  @memberof Format
*/

function computeValue (model, opts = {}, val) {
  const provided = arguments.length > 2
  const args = [model.generate, opts ? opts.once : false]
  if (provided) args.push(val)

  // Check that we can compute and either:
  return canCompute.apply(null, arguments)
    // 1. Generate the value, or
    ? _generate.apply(null, args)
    // 2. Return the unmodified value
    : val
}

/**
  Generates a value by executing all `gen.ops` functions

  @param {Object} gen The generator object {ops [, ...flags] }
  @param {Boolean} [runOnce] Flag to run 'once' generator functions
  @param {Mixed} [data] A provided value (if any)

  @throws {Error} When trying to run 'once' flags without passing `runOnce`
  @throws {Error} When function `fn` string reference cannot be found

  @private
  @ignore
*/

function _generate (gen, runOnce, data) {
  // Run immediately if `gen` is a function
  if (is.function(gen)) return gen()

  // Prepare the value to return
  let value

  if (gen.once && !runOnce) {
    throw new Error('Must pass `runOnce` flag for `once` generators')
  }

  // Has a value been provided?
  const provided = arguments.length > 2

  let ops = gen.ops

  // Ensure we're always dealing with an Array
  // (supports defining a generator as `key:{fns:{FNOBJ}`)
  if (!ops || !ops.length) ops = [ops]

  // Step through ops and generate value
  for (let i = 0; i < ops.length; i++) {
    let runner

    // When declared as `{ops: [function() {}]}`
    if (is.function(ops[i])) runner = ops[i]
    // When declared as `{ops: [{fn: function () {}}]}`
    else if (is.function(ops[i].fn)) runner = ops[i].fn

    if (!runner) {
      throw new Error('No generator method:' + ops[i].fn)
    }

    // On the first op, push the provided value (if any) to the end of the
    // arguments being run by the op
    if (!i && provided) {
      if (!ops[i].args) ops[i].args = []
      ops[i].args.push(data)
    }

    // If a value has been generated (by a previous function)
    // then pass 'value' to the function as its first parameter
    if (value) {
      ops[i].args
        ? ops[i].args.unshift(value)
        : ops[i].args = [value]
    }

    // Ensure args are treated as an array
    if (ops[i].args && !(ops[i].args instanceof Array)) {
      ops[i].args = [ops[i].args]
    }

    value = runner.apply(this, ops[i].args)
  }

  return value
}

/*
  Setup exports
*/

export {canCompute, computeValue}
