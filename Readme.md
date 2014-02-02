
# property

Property validation and casting

## Install

    npm install mekanika-property

## Usage

```js
var Property = require('mekanika-property');

var prop = new Property( 'key', options );
```

### Options

The options you can pass to a Property:

- **type** _{String}_ Force casts property value to type:
    - "string"
    - "boolean"
    - "number"
    - "integer"
    - "float"
    - "date"

- **array** _{Boolean}_ Multiple values flag (values cast to `type`)

- **default** _{any}_ value to apply if no value is set/passed

- **required** _{Boolean}_ flag if property MUST be set and/or provided

- **validators** _{Array}_ list of validation rules:
    - `[ { rule: validationFn, errorMsg: "Custom error string" }, ... ]`

## Overview

### Casting
#### .cast( val )
**Returns:** The cast value `val`

Casts a value to the property `type`.

```js
var age = new Property( 'age', {type:'number'} );
age.cast( '21' );
// -> 21 (converted string to number)
```

Cast will _throw_ an `Error` if there is no obvious way to transform `val` to `type`. See the comments for [type transform outcomes](https://github.com/mekanika/property/blob/master/lib/cast.js).

### Validation
Validators are simple functions that return true or false based on whether `val` meets a condition. A validator object is comprised of:

- **rule** _{Function}_ The method to test. @returns boolean
- **errorMsg** _{String}_ What to say if it fails
- **limits** _{Array}_ Arguments that are passed to your rule

Validators are added to Properties `validators` option on creation using the format:

```js
// A basic number comparison method
function compare( val, limit ) {
  return val > limit;
}

new Property( 'age', {
  validators: [
    {rule: compare, errorMsg:'Must be over 21', limits:[21] }
  ]
});
```

To run the validators, call `property#validate( val )`. Validators are run in the order they were added.

#### .validate( val )
**Returns:** _{Array}_ of Errors

Validates `val` against the property validators. Returns an empty array if no errors.

```js
age.validate( 50 );
// -> [] (empty array means no errors)
```

### Transforms
The transform methods are mechanisms to mutate a value. Property instances store two arrays `.setters` and `.getters` that can be applied using:

- `.applySetters( val )` - applies setter methods
- `.applyGetters( val )` - applies getter methods

**Returns:** Updated `val`

Add these methods as options:

```js
new Property('age', {setters:[ xformFn ], getters:[ gFn ]);
```

Or, push transform methods onto the stack using fluent property methods:

- `.get( fn )`
- `.set( fn )`


## License

MIT
