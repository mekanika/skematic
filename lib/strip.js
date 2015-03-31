
/**
  Import type checker
  @ignore
*/

var is = require('mekanika-lsd/is');


/**
  Export module
  @ignore
*/

module.exports = strip;


/**
  Remove fields from data (destructive, ie. modifies `data` directly)

  @param {Mixed|Mixed[]} values The value or array of values to match
  @param {Object} data

  @memberOf Format
  @alias strip
*/

function strip (values, data) {

  for (var k in data) {
    if (!data.hasOwnProperty(k)) continue;

    if (!is.array(values)) values = [values];
    for (var i= 0; i < values.length; i++) {
      if (data[k] === values[i]) delete data[k];
    }
  }

}
