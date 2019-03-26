# Skematic

**Data structure** and **rule validation** engine. Robust model schema for JS objects.


[![npm version](https://img.shields.io/npm/v/skematic.svg?label=version&style=flat-square)](https://npmjs.com/package/skematic) [![Code Climate](https://img.shields.io/codeclimate/github/mekanika/skematic.svg?style=flat-square)](https://codeclimate.com/github/mekanika/skematic) [![Travis](https://img.shields.io/travis/mekanika/skematic.svg?style=flat-square)](https://travis-ci.org/mekanika/skematic)

Universal, ultra fast and lightweight (4Kb!), `Skematic` enables you to _design_, _format_ and _validate_ data according to rules and conditions specified as simple config models, for browser and Node.js.

- [**Design**](#design): structure your data models as config objects
- [**Format**](#format): transform, generate and modify data structures
- [**Validate**](#validate): check that arbitrary data conforms to rules

A **basic example**:
```js
// -- Define a simple data structure
const Hero = {
  name:    {rules: {minLength: 4}, errors: 'Bad name!'},
  shouts:  {transform: val => val.trim().toUpperCase()},
  skill:   {default: 3, required: true, rules: {isNumber: true}},
  updated: {generate: Date.now}
}

// -- Format some data
Skematic.format(Hero, {shouts: '  woo   '})
// {shouts: 'WOO', skill: 3, updated: 1426937159385}

// -- Validate an object
Skematic.validate(Hero, {name: 'Zim'})
// {valid: false, errors: {name: ['Bad name!'], skill: ['Failed: required']}}
```

## Install

    npm install --save skematic

Import to your project:

```js
// CommonJS modules
const Skematic = require('skematic')
```

```js
// OR using ES6 Module imports
import Skematic from 'skematic'
```

To use in a browser:

```html
<script src="node_modules/skematic/build/skematic.min.js"></script>
```

> **Compatibility Note:** `Skematic` is written in ES6 but compiled down to ES5 and works across _all modern browsers_ (IE9+, Chrome, Firefox, Safari evergreens).
> Please note that the ES5 `Object.keys()` method is not supported by IE7 & 8, so to use `Skematic` in these fossil browsers, you'll need to install [es5-shim](https://github.com/es-shims/es5-shim) (and worship Satan :metal:).

## Usage

The API surface is small by design, with two **primary methods**:

- **.format**( model, data [, opts])  - see [Format](#format)
- **.validate**( model, data [, opts] )  - see [Validate](#validate)

## Design

### Model configuration

`Skematic` provides keys to define rules and conditions for your data model. Config keys are **all optional**.

Format:
- **default** _{any}_ value to apply if no value is set/passed
- **lock** _{Boolean}_ disallows/strips value on format (`unlock` format opts to override)
- **transform** _{Function}_ a function to transform a value (not called if value is undefined or null)
- [**generate**](#generate) _{Object|Function}_ enables computing a value from functions
- **show** _{String|Array}_ string scopes required to show field on format (hides if not met)
- **write** _{String|Array}_ scopes required to validate this field being set (fails validation if `scopes` aren't matching)
- [**model**](#sub-model) _{Object}_ declare sub-model defining this value (see "[Sub-model](#sub-model)")

Validate:
- [**rules**](#rules) _{Object}_ validation rules: `{rules: {min: 3, max: 11}}`
- [**errors**](#custom-error-messages) _{Object|String}_ error messages for rules
- **required** _{Boolean}_ flag if property MUST be set and/or provided

Advanced:
- **allowNull** _{Boolean}_ Accept `null` values (no other validation applied) or set to `false` to _force_ a NOT NULL condition (no undefined or null values permitted). Designed to: 
  - a) `false`: enables setting `required` (which ordinarily passes for `null`) while disallowing `null` as a value.
  - b) `true`: enables accepting `null` without triggering any other rule validation (ie. 'null' becomes a valid value)
- [**primaryKey**](#primarykey) _{Boolean}_ flag to indicate whether this field is the primary key (id field), used in conjunction with `mapIdFrom` [format option](#format-options) to allow transposing your datastore id to some other field on your data model (eg. Mongo's `_id` can be mapped to the field you set `primaryKey: true` on)

> Note: See format()'s [**order of execution**](#format-order-of-updates) for which formatting changes get applied in what order.


### Simple examples

A basic data model:

```js
const Hero = {
  name: {
    default: 'Genericman',
    required: true,
    rules: {maxLength: 140, minLength: 4},
    errors: {maxLength: 'Too long', minLength: 'Shorty!'}
  }
}

// Generate a record by passing null/undefined to `format(Model, null)`
Skematic.format(Hero)
// -> {name: 'Genericman'}

Skematic.validate(Hero, {name: 'Spiderman'})
// -> {valid: true, errors: null}
Skematic.validate(Hero, {name: 'Moo'})
// -> {valid: false, errors: {name: ['Shorty!']]}}
```

Typically you'll create a more complete data model to represent your application objects, with several fields to format and validate:

```js
const Hero = {
  name: HeroNameField,
  skill: {default: 0}
}

Skematic.validate(Hero, {name: 'Spiderman', skill: 15})
// -> {valid: true, errors: null}
Skematic.validate(Hero, {name: 'Moo'})
// -> {valid: false, errors: {name: ['Shorty!']}
```

### Rules

Several validation rules are built in. Custom rules are defined as functions that receive the field value and return pass/fail (true/false). Notably, 'required' is passed as a property option, rather than a rule. 

If _any_ rules are defined on the model they will attempt to validate, _even if no data value is provided_. To only run the rules when data is provided, validate using the `{ sparse: true }` option.

The other available validators are:

- **.min** - The lowest permitted number
- **.max** - The highest permitted number
- **.minLength** - The shortest string permitted
- **.maxLength** - The longest string permitted
- **.eq** - Value must be strictly equal
- **.neq** - Value must not equal
- **.oneOf** - Value must be one of the values in the list of elements
- **.notOneOf** - Value must NOT be in the list of elements
- **.has** - List of elements contains the value
- **.hasNot** - List of elements does NOT contain the value
- **.isEmail** - no parameters: Is the string an email
- **.isUrl** - no parameters: Is the string a URL
- **.isAlpha** - no parameters: Checks value is an ALPHA string (abcd...)
- **.isAlphaNum** - no parameters: Checks value is AlphaNumeric (abc..012..9)
- **.isNumber** - no parameters: Checks value is a Number (NaN fails this test)
- **.isString** - no parameters: Checks value is of type String
- **.match** - String must match regexp
- **.notMatch** - String must NOT match regexp
- **.isEmpty** - set to `true` to check the value is empty
- **.notEmpty** - set to `true` to check the value is **not** empty

**Custom rules** can be applied by providing your own validation functions that accept a `value` to test and return a `Boolean` (pass/fail).

> Note: The `required` rule has a special shorthand to declare it directly on the model:
>
> ```js
> const modelProp = {default: 'Boom!', required: true}
> ```

Declare `rules` key as follows:

```js
const User = {
  name: {
    rules: {minLength: 5}
  }
}

Skematic.validate(User, {name: 'Zim'})
// -> {valid: false, errors: {name: ['Failed: minLength']}}

Skematic.validate(User, {name: 'Bunnylord'})
// -> {valid: true, errors: null}
```

#### Custom Rules
You can mix in **Custom rules** that have access to the rest of the data model via `this`. For example:

```js
const User = {
  name: {
    rules: {
      // A built in validation
      minLength: 5,
      // Your own custom validator (accepts `value` to test, returns Boolean)
      // Note: MUST use `function () {}` notation to access correct `this`
      onlyFastBunnylord: function myCustomCheck (value) {
        // See us access the `speed` prop in our check:
        return value === 'Bunnylord' && this.speed > 5
      }
    }
  }
  speed: {default: 5}
}

// Wrong name
Skematic.validate(User, {name: 'Zim', speed: 10})
// -> {valid: false, errors: {name: ['Failed: minLength', 'Failed: onlyFastBunnylord']}}

// Too slow!
Skematic.validate(User, {name: 'Bunnylord', speed: 3})
// -> {valid: false, errors: {name: ['Failed: onlyFastBunnylord']}}

Skematic.validate(User, {name: 'Bunnylord', speed: 10})
// -> {vaid: true, errors: null}
```


### Custom **error** messages

Custom error messages can be declared per rule name:
`{errors: {'$ruleName': 'Custom message'}}`

Provide a default message if no specific error message exists for that rule:

```js
{
  errors: {
    max: 'Too large',
    default: 'Validation failed'
  }
}
```

Usage example:

```js
const User = {
  name: {
    rules: {minLength: 5},
    errors: {minLength: 'Name too short!'}
  }
}

// Using a value test:
Skematic.validate(User.name, 'Zim')
// -> {valid:false, errors:['Name too short!']}

// Using a keyed object value test:
Skematic.validate(User, {name:'Zim'})
// -> {valid:false, errors:{name:['Name too short!']}}
```

> Note: You can create error messages for custom rules too. Just use the same key you used to define the custom rule.
> `{rules: {myCustom: val => false}, errors: {myCustom: 'Always fails!'}}`

Rules can be combined, and you can declare a string message on errors to apply to any and all errors:

```js
const User = {
  name: {
    rules: {minLength: 5, maxLength: 10},
    errors: 'Name must be between 5 and 10 characters'
  }
}
```

### Generate

**Computed values** - `Skematic` keys can generate values using functions referenced in the `generate` directive.

The simplest usage is to specify `generate` as a function:

```js
{generate: () => Date.now()}
```

You may also pass `generate` a config object with properties:

> Legend: **field** - _{Type}_ `default`: Description

- **ops** _{Array}_ of fn objects `{fn [, args])` or functions. The first function in the list is passed the value of the object being formatted. The output of each function is passed as the first parameter of the next.
- **preserve** _{Boolean}_ `false`: OPTIONAL Preserves a provided value and does not overwrite if set to `true`. (If left as `false`, generate will always replace the provided value). Note: `undefined` values treated as being NOT SET - use `null` to pass 'no value'
- **require** _{Boolean_ `false`: OPTIONAL Ensures that value is only generated if the field exists on the provided data.
- **once** _{Boolean}_ `false`: OPTIONAL Flag this field to only generate if `.format()` is called with the option `once:true`. Useful for fields like "created".

Unless instructed otherwise (via flags) `generate` will compute a value _every_ time and _overwrite_ any provided value. To preserve any provided value set `preserve: true` (note that `undefined` is treated as not set, use `null` to provide a no-value). To _only_ generate a value when the key for that field is provided, set `require: true`. To manually run generators based on a flag provided to format, set `{once: true}` on the model field, (and run `format(Model, data, {once: true})`.

Example:

```js
const Hero = {
  updated: {
    generate: {
      // The ops array lists fn objects or functions
      ops: [
        // A fn object specifies `fn` and `args`
        {fn: myFunc, args: []},
        // , {fn...}, etc etc
        // And here is a raw function with no args, it will be passed
        // the output of the last `fn` as its first parameter
        anotherFn
      ],
      // Optional flag: preserves a provided value
      // (default: false)
      preserve: false,
      // Optional flag: ONLY generate if provided a field on data
      // (default: false)
      require: false,
      // Optional flag: Require passing {once:true} to format to compute value
      // (default: false)
      once: true
    }
  }
};
```

That looks like a mouthful - but if we pass the raw functions and assume default settings for the other flags, the above collapses to:

```js
const Hero = {
  updated: {generate: {ops: [myFunc, anotherFn], once: true}}
};
```


### Sub-model

A property can be formatted to another model (essentially, a complex object), or array of models.

```js
// A "post" would have comments made up of `owner_id, body`
const Post = {
  comments: { 
    model: {
      owner_id: {lock: true},
      body: {rules: {minLength: 25, }}
    }
  }
}

// Or, a simple scalar array of "tags" (an array of strings):
const Picture = {
  url: {rules: {isURL: true}},
  tags: {model: {rules: {minLength: 3}}}
}
```

All the model validations and checks assigned to the sub-model (`comments`) will be correctly cast and enforced when the parent (`post`) has any of its validation routines called.


### primaryKey

A model can declare any **one** of its fields as the **primary key** (the id field) to be used for its data objects. This can be used in conjunction with `Skematic.format()` in order to _modify_ an incoming data collection and map a pre-existing id field (say for example "_id") to the `primaryKey`.

This is useful for data stores that use their own id fields (eg. MongoDB uses '_id').

```js
const propSchema = {
  prop_id: {primaryKey: true},
  name: {type: Skematic.STRING}
}

// Example default results from data store:
let data = [{_id: '512314', name: 'power'}, {_id: '519910', name: 'speed'}]

Skematic.format(propSchema, {mapIdFrom: '_id'}, data)
// -> [{prop_id: '512314', name: 'power'}, {prop_id: '519910', name: 'speed'}]
```

> Note: Your data store might automatically use a particular field name for its identifying purposes (usually `"id"`). If you **know** you're using a datastore that defaults its id field to a given key, you can simply reuse this field name in your model. Specifying `primaryKey` is simply a way to _force_ data models into using a given key.



## Format

Format creates and returns a conformed data structure based on the model and input data provided.

> Side-effect free, format never mutates data

```js
Skematic.format(model [, data] [, opts])
// -> {formattedData}
```

**Special case**: Passing format no data will cause format to **create** blank record based on your model `format(model)`, including defaults and generated fields. You can pass options too, as follows: `format(model, null, {defaults: false})`

Parameters:

- **model**: The model to format against
- **data**: The data object to format. If `null` or `undefined`, format will attempt to _create_ data to return
- **opts**: _[Optional]_ options hash (see below)

```js
Skematic.format(Hero) // create a data block
// -> {name: 'Genericman'}

Skematic.format(Hero, {name: 'Zim'})
// -> {name: 'Zim'}

// Or with options
Skematic.format(Hero, {name: 'Zim', junk: '!'}, {strict: true})
// -> {name: 'Zim'}
```


#### Format options

Format _options_ include:

> Legend: **field** - _{Type}_ - `default`: Description

- **scopes** - _{String|Array}_ - `undefined`: List of scopes that toggle `.show` model fields on format() (See validate() for `.write` scopes)
- **unscope** - _{Boolean}_ - `false`: Ignores 'show' of scopes (ie. shows all fields)
- **strict** - _{Boolean}_ - `false`: Strips any fields not declared on model
- **sparse** - _{Boolean}_ - `false`: Only process fields on the provided data, rather than all fields on the entire model
- **defaults** - _{Boolean}_ - `true`: Set default values on 'empty' fields. Toggle to `false` to disable.
- **generate** - _{Boolean}_ - `true`: Enable/disable generating new values - see [Design:generate](#generate)
- **once** - _{Boolean}_ - `false`: Run generator functions set to `{once: true}` - see [Design:generate](#generate)
- **transform** _{Boolean}_ - `true`: Toggle to `false` to cancel modifying values
- **unlock** - _{Boolean}_ - `false`: Unlocks 'lock'ed model fields (ie. no longer stripped, allows for overwriting).
- **strip** - _{Array}_ - `[]`: Remove fields with matching values from `data`
- **mapIdFrom** - _{String}_ - `undefined`: Maps a primary key field from the field name provided (requires a `primaryKey` field set on the model)

#### Format order of updates

Format applies these options in significant order:

0. `scopes`: Checks scope match - hides field if the check fails
1. `lock`: Strip locked fields (unless `{unlock: true}` provided)
2. `sparse`: Only processes keys on the provided data (not the whole model)
3. `defaults`: Apply default values
4. `generate`: Compute and apply generated values
5. `transform`: Run transform functions on values
6. `strip`: Removes field with matching values after all other formatting
7. `mapIdFrom`: Sets the id field on data to be on the 'primaryKey'

Meaning if you have an uppercase transform, it will run AFTER your generate methods, thus uppercasing whatever they produce.

Format examples:

```js
const myModel = {
  mod_id: {primaryKey: true},
  rando: {generate: {ops: Math.random, once: true}},
  power: {default: 5},
  name: {default: 'zim', transform: val => val.toUpperCase()},
  secret: {show: 'admin'}
};

Skematic.format(myModel, {}, {once: true})
// -> {rando: 0.24123545, power: 5, name: 'ZIM'}

Skematic.format(myModel, {}) // (model, data)
// -> {power: 5, name: 'ZIM}

Skematic.format(myModel, {}, {defaults: false})
// -> {}

Skematic.format(myModel, {rando: undefined, power: 'x'}, {strip: [undefined, 'x']})
// -> {name: 'ZIM'}

Skematic.format(myModel, {name: 'Zim', secret: 'hi!'}, {scopes: ['admin']})
// -> {name: 'ZIM', secret: 'hi!'}
Skematic.format(myModel, {name: 'Zim', secret: 'hi!'}, {scopes: ['not:admin']})
// -> {name: 'ZIM'}

Skematic.format(myModel, {name: 'Gir'}, {sparse: true})
// -> {name: 'GIR'}

Skematic.format(myModel, {_id: '12345'}, {mapIdFrom: '_id'})
// -> {mod_id: '12345', power: 5, name: 'ZIM'}
```

## Validate

Validation applies any [rules](#rules) specified in the `model` fields to the provided `data` and returns an object `{valid, errors}`:

```js
Skematic.validate(model, data [, opts])
// -> {valid: <Boolean>, errors: {$key: [errors<String>]} | null}
```

Parameters:

- **model**: The model to validate against
- **data**: The data object to validate
- **opts**: _[Optional]_ options hash (see below)

```js
Skematic.validate(Hero, {name: 'Zim'})

// Or with options
Skematic.validate(Hero, {name: 'Zim'}, {sparse: true})
```

Returns an object `{valid: $boolean, errors: $object|$array|null}` where the `errors` key may be:

- `null` - no errors
- `array` - of errors if validating a scalar (string, number, etc)
- `object` - hash of errors when validating a data object

Validate _options_ include:

> Legend: **field** - _{Type}_ - `default`: Description

- **scopes** - _{String|Array}_ - `undefined`: List of scopes that will be tested against `.write` model fields for matches. Errors if scopes don't meet.
- **unscope** - _{Boolean}_ - `false`: Ignores any `.write` scope requirements on the model
- **strict** - _{Boolean}_ - `false`: Validates that all keys provided by data are defined on the model as well as valid (prevents validating/accepting extraneous fields)
- **sparse** - _{Boolean}_ - `false`: Only process fields on the provided data, rather than all fields on the entire model
- **keyCheckOnly** - _{Boolean}_ - `false`: **Overrides normal validation** and ONLY checks user data keys are all defined on model. Useful to ensure user is not sending bogus keys. @see [Format options: `strict`](#format) to simply strip unknown keys.


## Development

`Skematic` is written in **ES6+**.

Developing Skemetic requires installing all dependencies:

    npm install

Run the tests:

    npm test

> Note: Generated API docs can be found in the _npm installed package_ under `docs/index.html`. Otherwise generate them using `npm run docs`

**Benchmarks:** The `perf/benchmark.js` is simply a check to ensure you haven't destroyed performance: `npm run benchmark`. Skematic runs at several tens of thousands of complex validations per second on basic hardware.

Code conventions based on [**Standard**](https://github.com/feross/standard).

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

### Contributions

Contributions to `Skematic` are welcome.

- Maintain the existing code style conventions
- Ensure your code passes Standard lint `npm run lint`
- Include tests that fail without your code, and pass with it
- Add documentation (JSDoc for functions, README updates, etc)
- Open a pull request

### License

Copyright 2017 [@cayuu](https://github.com/cayuu)
v2+ Released under the **ISC License** ([ISC](https://opensource.org/licenses/ISC))
