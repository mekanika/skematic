
/**

  Schema intends to work as follows:

  0. .default()   - Returns/Applies defaults if no value
  1. .filter()    - Run filters to transform the value (including casting)
  2. .typeCheck() - Check value matches expected 'type'
  3. .test()      - Apply any rules to validate content

  .validate() runs all the above and returns:
  {
    valid: true/false
    errors: [],
    value: $
  }
*/


/**
  Dependencies
*/

var Cast = require('./cast');
var Rules = require('./rules');
