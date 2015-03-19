
/**
  Setup exports
*/

module.exports = exports;


/**
  Determines whether a generator SHOULD be run or not.

  Be very careful passing `undefined` as "val" as this will assume that the
  "val" has been _provided_ as far as the generator flags are concerned. In
  general, DO NOT pass `val` if the value does not exist on your data object.

  @param {Schema} skm
  @param {Object} opts Options hash. Only contains `once` flag.
  @param {Mixed} [val] Optional value to pass. If passed assumed `provided`.

  @return {Boolean} Passes if all the flags to compute are met

  @ignore
*/

exports.canCompute = function (skm, opts, val) {
  if (!skm || !skm.generate) return false;

  // Shorthand
  var gen = skm.generate;

  var runOnce = opts.once;

  // Skip if there is no generator
  if (!gen) return false;

  // Has a value been provided by the caller
  var provided = arguments.length > 2;

  var preserve = gen.preserve;
  var require = gen.require;
  var once = gen.once;

  // Don't generate on the following conditions
  if (once && !runOnce) return false;
  if (provided && preserve) return false;
  if (require && !provided) return false;

  return true;
};


/**
  Generic 'computed' function runner

  Parses a schema for functions to generate a value for a given object key.
  If schema declares an array of functions, the output of each function will
  be passed as the first parameter to the next function.

  Generators are passed in via schema:

  ```
  var myModel = {
    created: {
      generate: {
        ops: [{fn:'date'}],
        preserve: true|false,
        require: true|false
      }
    }
  }
  ```

  Flags for processing:

  - preserve: If a value is provided DO NOT regenerate, OVERRIDES every
  - require: Regenerate ONLY WHEN a key is provided (ie. require a provided key)

  @param {Object} obj The data object to transform and return
  @param {Schema} s A valid Schema# to parse for generator function references

  @throws {Error} when a named function is not found in Schema.lib
  @return {Object} The data object with generated values attached
*/

exports.computeAll = function (obj, s, runOnce) {
  for (var key in s) {
    var provided = false;

    // Is a value ACTUALLY present on the data object
    if (Object.keys(obj).indexOf(key) > -1) provided = true;

    // Setup 'canCompute' parameters
    var args = [s[key], {once:runOnce}];
    if (provided) args.push(obj[key]);

    var canCompute = exports.canCompute.apply(null, args);

    // Shorthand
    var gen = s[key].generate;

    var compargs = [gen, runOnce];
    if (provided) compargs.push(obj[key]);
    if (canCompute) obj[key] = _generate.apply( null, compargs );
  }

  return obj;
};


/**
  Computes a single value (rather than stepping through a data object).

  Checks whether compute is valid (ie. should run) for this schema, and either
  returns the computed value or the passed value.

  @param {Schema} skm
  @param {Object} opts Options hash. Only contains `once` flag.
  @param {Mixed} [val] Optional value to pass

  @return {Mixed} The computed value (if any) or the passed `val`
*/

exports.computeValue = function (skm, opts, val) {

  var provided = arguments.length > 2;
  var args = [skm.generate, opts.once];
  if (provided) args.push( val );

  // Check that we can compute and either:
  return exports.canCompute.apply( null, arguments )
    // 1. Generate the value, or
    ? _generate.apply( null, args )
    // 2. Return the unmodified value
    : val;

};


/**
  Generates a value by executing all `gen.ops` functions

  @param {Object} gen The generator object {ops [, ...flags] }
  @param {Boolean} [runOnce] Flag to run 'once' generator functions
  @param {Mixed} [data] A provided value (if any)

  @throws {Error} When trying to run 'once' flags without passing `runOnce`
  @throws {Error} When function `fn` string reference cannot be found

  @ignore
*/

function _generate(gen, runOnce, data) {

  if (gen.once && !runOnce)
    throw new Error('Must pass `runOnce` flag for `once` generators');

  // Has a value been provided?
  var provided = arguments.length > 2;

  var value;

  var ops = gen.ops;
  var fnLib = require('./schema').lib;

  // Ensure we're always dealing with an Array
  // (supports defining a generator as `key:{fns:{FNOBJ}`)
  if (!ops || !ops.length) ops = [ops];

  // Step through ops and generate value
  for (var i=0; i < ops.length; i++) {
    var runner;

    if (typeof ops[i] === 'function') runner = ops[i];
    else runner = fnLib[ops[i].fn];

    if (!runner)
      throw new Error ('No generator method:'+ops[i].fn);


    // On the first op, push the provided value (if any) to the end of the
    // arguments being run by the op
    if (!i && provided) {
      if (!ops[i].args) ops[i].args = [];
      ops[i].args.push(data);
    }

    // If a value has been generated (by a previous function)
    // then pass 'value' to the function as its first parameter
    if (value) ops[i].args
      ? ops[i].args.unshift(value)
      : ops[i].args = [value];

    // Ensure args are treated as an array
    if (ops[i].args && !(ops[i].args instanceof Array))
      ops[i].args = [ops[i].args];

    // Resolve function parameters to values
    var k = -1, px = ops[i].args || [];
    while (++k < px.length) {
      if (typeof px[k] === 'function') px[k] = px[k]();
    }

    value = runner.apply( this, ops[i].args );
  }

  return value;
}
