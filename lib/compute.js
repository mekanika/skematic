
/**
  Setup exports
*/

module.exports = exports;


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
    // Shorthand
    var gen = s[key].generate;

    // Skip if there is no generator
    if (!gen) continue;

    // Has a value been provided by the caller
    var provided = Object.keys(obj).indexOf(key) > -1;

    var preserve = gen.preserve;
    var require = gen.require;
    var once = gen.once;

    // Don't generate on the following conditions
    if (once && !runOnce) continue;
    if (provided && preserve) continue;
    if (require && !provided) continue;

    obj[key] = computeValue.call( obj, gen );
  }

  return obj;
};


/**
  The value of `this` needs to be passed via a `.call()`
*/

var computeValue = exports.computeValue = function (gen) {

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
};
