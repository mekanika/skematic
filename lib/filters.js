
/**
  Dependencies
  @ignore
*/

var Cast = require('./typeconvert');


/**
  Export transform modules
  @ignore
*/

module.exports = exports = {};


/**
  Available filter functions (modifiers for value)
*/

var _filters = {
  trim: function(v) { return v.trim(); },
  nowhite: function (v) { return v.replace( / /g, ''); },
  uppercase: function (v) { return v.toUpperCase(); },
  lowercase: function (v) { return v.toLowerCase(); }
};

// Add 'to$CAST' casters to filters
for (var cast in Cast) {
  if (cast.substr(0,2)==='to') _filters[cast] = Cast[cast];
}


/**
  Applies a list of filter functions

  @param {Mixed} val The value to filter
  @param {String[]} filters Array of named filters to apply

  @throws {Error} if filter cannot be applied
*/

exports.filter = function (val, filters) {
  // No-op if no filters
  if (!filters) return val;

  // Do not attempt to filter 'undefined' values
  if (val === undefined) return val;

  // Ensure filters are provided as an array
  if (typeof filters === 'string') filters = [filters];

  filters.forEach( function (key) {
    // Try-catch is to make it CLEAR that this can throw
    // May be useful in future to do more than propagate throw
    try {
      // @note this will silently fail if no filter is found...
      if ( _filters[key] ) val = _filters[key]( val );
    }
    catch( e ) { throw e; }
  });

  return val;
};


/**
  Exposes the available filters as an array

  @return {Array}
*/

exports.filter.available = function () {
  return Object.keys(_filters);
};


/**
  Adds a named `key` filter `fn`

  @param {String} key The identifier for the filter
  @param {Function} fn The filter function (passed `v` and returns modified `v`)
*/

exports.filter.add = function (key, fn) {
  _filters[ key ] = fn;
};
