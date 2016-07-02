# Skematic

**Data structure** and **rule validation** engine. Robust schema for JS objects.


[![npm version](https://img.shields.io/npm/v/skematic.svg?label=version&style=flat-square)](https://npmjs.com/package/skematic) [![Code Climate](https://img.shields.io/codeclimate/github/mekanika/skematic.svg?style=flat-square)](https://codeclimate.com/github/mekanika/skematic)


> :warning: :construction: [**Skematic v2.0**](https://github.com/mekanika/skematic/issues/26) is currently in progress. `v0.16` is deprecated. **Breaking things**.

Universal, ultra fast and lightweight (5Kb!), `Skematic` enables you to _design_, _format_ and _validate_ data according to rules and conditions specified as simple config objects, for browser and Node.js.

- [**Design**](#design): structure your data models as config objects
- [**Format**](#format): transform, generate and modify data structures
- [**Validate**](#validate): check that arbitrary data conforms to rules

A **basic example**:
```js
// -- Define a simple data structure
const Hero = {
  name:    {rules: {minLength: 4}, errors: 'Bad name!'},
  shouts:  {transforms: ['trim', 'uppercase']},
  skill:   {type: 'number', default: 3, required: true},
  updated: {generate: Date.now}
}

// -- Format some data
Skematic.format(Hero, {shouts: '   woo    '})
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

## API

> :warning: :construction: **Breaking changes pending in v2.0**

The API surface is small by design, with two **primary methods**:

- **.format**( schema, data [, opts])  - see [Format](#format)
- **.validate**( schema, data [, opts] )  - see [Validate](#validate)

> Note: Generated API docs can be found in the _npm package_ under `docs/index.html`

A few other **convenience methods** are provided, that mostly encapsulate or expose specific functionality in format or validate:

- **.createFrom**( schema ) - _generate an object from schema definitions_ - see [createFrom](#createfrom) ![status:unstable](https://img.shields.io/badge/status-unstable-orange.svg?style=flat-square)

Optional setup methods:

- **.useGenerators**( fnObj ) - _hash of functions used to generate values_ - see [Format:generate](#generate)
- **.useSchemas**( schemas )  - _hash of schemas for lookup by string_ - see [Design:sub-schema](#sub-schema)


## Design

### Schema configuration

`Skematic` provides keys to define rules and conditions for your data. Config keys are **all optional**.

- **type** _{String}_ Specify a _rule_ that value is type:
    - "string"
    - "boolean"
    - "number"
    - "integer"
    - "array"
    - "object"
- **default** _{any}_ value to apply if no value is set/passed
- **protect** _{Boolean}_ disallows user from setting value (stripped on `format()`)
- [**transforms**](#transforms) _{Array}_ string values of transform to apply (transforms)
- [**generate**](#generate) _{Object}_ enables computing a value from functions
- **required** _{Boolean}_ flag if property MUST be set and/or provided
- **allowNull** _{Boolean}_ Accept `null` values (no other validation applied) or set to `false` to _force_ a NOT NULL condition (no undefined or null values permitted)
- [**rules**](#rules) _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }`
- [**errors**](#custom-error-messages) _{Object|String}_ hash of error messages for rules
- [**schema**](#sub-schema) _{Object|String}_ declare sub-schema defining this value (see "Sub-schema")
- [**primaryKey**](#primarykey) _{Boolean}_ flag to indicate whether this field is the primary key (id field)

> Note: As you can see, keys that can contain many values are always plural, eg. `transforms`, `rules`, etc. Keys that only contain one value or item are always singular, eg. `default`, `required`, `schema`, etc.


### `$dynamic` keys

In some cases it is useful to apply the same schema to all the fields on an object (or sub-object), even if you don't know what those key names are. In this case, specify **`$dynamic`** rather than the field name:

```js
const KnownKeys = {
  propA: {default: 'sweet', required: true},
  propB: {default: 'sweet', required: true} // etc etc
}

const Dynamic = {
  $dynamic: {default: 'sweet', required: true}
}
```

The `$dynamic` key will apply to _every_ field on your object at the level you specify, and `Skematic` will not process any other declared rules. Place `$dynamic` keys anywhere you'd use a normal field name:

```js
const MoreNested = {
  props: {
    schema: {
      $dynamic: {
        schema: {
          value: {default: '!', required: true}
        },
        default: {}
      }
    },
    default: {}
  }
}

Skematic.format(MoreNested, {props: {randCrazy: undefined}})
// -> {props: {randCrazy: {value: '!' } } }

Skematic.validate(MoreNested, {props:{ crazy:{} }})
// -> {valid: false, errors: {props: {crazy: ['Required to be set']}} }

Skematic.validate(MoreNested, {props: {crazy: {value: 99}}})
// -> {valid: true, errors: null }
```


### Simple examples

A data model for a single key/field (eg. `name`):

```js
const HeroNameField = {
  type: 'string',
  default: 'Genericman',
  transforms: ['toString', 'nowhite'],
  required: true,
  rules: {maxLength: 140, minLength: 4},
  errors: {maxLength: 'Too long', minLength: 'Shorty!'}
}

Skematic.validate(HeroNameField, 'Spiderman')
// -> {valid: true, errors: null}
Skematic.validate(HeroNameField, 'Moo')
// -> {valid: false, errors: ['Shorty!']]}
```

Typically you'll create a more complete data model to represent your application objects, with several fields to format and validate:

```js
const Hero = {
  name: HeroNameField,
  skill: {type: 'number', default: 0}
}

Skematic.validate(Hero, {name: 'Spiderman', skill: 15})
// -> {valid: true, errors: null}
Skematic.validate(Hero, {name: 'Moo', skill: 'magic'})
// -> {valid: false, errors: {name: ['Shorty!'], skill: ['Not of type: number']}}
// (Note: errors is an object when validating objects)
```

### Transforms

The following built-in transforms can be used to type convert and otherwise modify a provided value:

- **trim**- trims whitespace from start and end of string value
- **nowhite** - removes all whitespace from a string value
- **lowercase** - converts a string value to lowercase
- **uppercase** - converts a string value to uppercase
- **toString** - converts value to a String
- **toNumber** - converts value to a Number
- **toFloat** - converts value to a Float
- **toInteger** - converts value to an Integer
- **toBoolean** - converts value to a Boolean
- **toDate** - converts value to an ISO 8601 Date eg. `2000-01-01T00:00:00.000Z`

These are provided as an array on key `transforms`:

```js
const mySchema = {
  handle: {transforms: ['trim', 'lowercase']}
}
```

### Rules

Several validation rules are built in. Notably, 'required' is passed as a property option, rather than a rule. The other available validators are:

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
- **.match** - String must match regexp
- **.notMatch** - String must NOT match regexp
- **.empty** - `true` checks the value is empty, `false` checks it's not

Declare `rules` key as follows:

```js
const User = {
  name: {
    rules: {minLength: 5}
  }
}

Skematic.validate(User.name, 'Zim')
// -> {valid: false, errors: ['Failed: minLength']}
```

> Note: The `required` rule has a special shorthand to declare it directly on the schema:
>
> ```js
> const model = {type: 'string', required: true}
> ```

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

Usage example :

```js
const User = {
  name: {
    rules: {minLength: 5},
    errors: {minLength: 'Name too short!'}
  }
}

// Using a "scalar" value test:
Skematic.validate(User.name, 'Zim')
// -> {valid:false, errors:['Name too short!']}

// Using a keyed object value test:
Skematic.validate(User, {name:'Zim'})
// -> {valid:false, errors:{name:['Name too short!']}}
```

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

Alternatively you may also pass a config object with properties:

> Legend: **field** - _{Type}_ `default`: Description

- **ops** _{Array}_ of fn objects `{fn [, args])` or functions. The first function in the list is passed the value of the object being formatted. The output of each function is passed as the first parameter of the next.
- **preserve** _{Boolean}_ `false`: OPTIONAL Preserves a provided value and does not overwrite if set to `true`. (If left as `false`, generate will always replace the provided value)
- **require** _{Boolean_ `false`: OPTIONAL Ensures that value is only generated if the field exists on the provided data.
- **once** _{Boolean}_ `false`: OPTIONAL Flag this field to only generate if `.format()` is called with the option `once:true`. Useful for fields like "created".

> Unless instructed otherwise (via flags) `generate` will compute a value _every_ time and _overwrite_ any provided value. To preserve any provided value set `preserve: true`. To _only_ generate a value when the key for that field is provided, set `require: true`. To ensure a generator is only run when you pass a `{generate:'once'}` to format(), set the `once: true` flag.

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
      // Optional flag: Require passing {generate:'once'} to format to compute value
      // (default: false)
      once: false
    }
  }
};
```

That looks like a mouthful - but if we pass the raw functions and assume default settings for the other flags, the above collapses to:

```js
const Hero = {
  updated: {generate: {ops: [myFunc, anotherFn]}}
};
```

#### Generators by string reference - **`useGenerators()`**

You can _optionally_ instruct Skematic to lookup generator functions you've referenced by string, by passing the hash of functions to `useGenerators()`:

```js
// Load in a keyed function library
Skematic.useGenerators({
  magic: function () {
    // Generates a random string of characters
    return Math.random().toString(36).substr(2);
  }
})

// Reference a generator by STRING: 'magic'
const SpinModel = {
  rando: {generate: {ops: [{fn: 'magic'}]}}
}

Skematic.createFrom(SpinModel)
// -> {rando: '5wyml04ey1xos9k9'}
```

### Sub-schema

A property can be formatted to another schema (essentially, a complex object), or array of schema.

```js
// A "post" would have comments made up of `owner_id, body`
const Post = {
  comments: { type: 'array', schema: {
    owner_id: {type: 'number'},
    body: {type: 'string', rules: {minLength: 25}}
    }
  }
}

// Or, a simple scalar array of "tags" (an array of strings):
const Picture = {
  url: {type: 'string'},
  tags: {type: 'array', schema: {type: 'string', rules: {minLength: 3}}}
}
```

All the schema validations and checks assigned to the sub-schema (`comments`) will be correctly cast and enforced when the parent (`post`) has any of its validation routines called.

#### Schema by string reference - **`useSchemas()`**

When storing schema data structures as JSON, it can be handy to reference definitions by String (rather than as objects):

```js
const allMyModels = {
  Taste: {
    major: {rules: {exists: ['sweet', 'sour', 'salty', 'other']}},
    description: {type: 'string'}
  },

  Jellybean: {
    // Reference by String
    taste: {schema: 'Taste'}
  }
}

// Tell Skematic to lookup string references on this object
Skematic.useSchemas(allMyModels)
```


### primaryKey

A schema can declare any **one** of its fields as the **primary key** (the id field) to be used for its data objects. This can be used in conjunction with `Skematic.format()` in order to _modify_ an incoming data collection and map a pre-existing id field (say for example "_id") to the `primaryKey`.

This is useful for data stores that use their own id fields (eg. MongoDB uses '_id').

```js
const propSchema = {
  prop_id: {primaryKey: true},
  name: {type: 'string'}
}

// Example default results from data store:
let data = [{_id: '512314', name: 'power'}, {_id: '519910', name: 'speed'}]

Skematic.format(propSchema, {mapIdFrom: '_id'}, data)
// -> [{prop_id: '512314', name: 'power'}, {prop_id: '519910', name: 'speed'}]
```

> Note: Your data store might automatically use a particular field name for its identifying purposes (usually `"id"`). If you **know** you're using a datastore that defaults its id field to a given key, you can simply reuse this field name in your schema. Specifying `primaryKey` is simply a way to _force_ data models into using a given key. ([Adapters](https://github.com/mekanika/adapter) will use this information to map their usual id field onto your primary key)



## Format

Format creates and returns a conformed data model based on the schema and input data provided.

> Side-effect free, format never mutates data

```js
Skematic.format(schema [, data] [, opts])
// -> {formattedData}
```

**Special case**: Passing format no data will cause format to **create** blank model based on your schema, including defaults and generated fields. You can pass options too, as follows: `format(schema, null, {defaults: false})`

Parameters:

- **schema**: The schema to format against
- **data**: The data object to format
- **opts**: _[Optional]_ options hash (see below)

```js
Skematic.format(Hero, {name: 'Zim'})

// Or with options
Skematic.format(Hero, {name: 'Zim', _junk: '!'}, {strict: true})
```

Format _options_ include:

> Legend: **field** - _{Type}_ - `default`: Description

- **strict** - _{Boolean}_ - `false` Strips any fields not declared on schema
- **sparse** - _{Boolean}_ - `false`: Only process fields on the provided data, rather than all fields on the entire schema
- **defaults** - _{Boolean}_ - `true`: Set default values on 'empty' fields. Toggle to `false` to disable.
- **generate** - _{Boolean|"once"}_ - `true`: Compute a new value - see [Design:generate](#generate)
- **once** - _{Boolean}_ - `false`: Run generator functions set to `{once: true}` - see [Design:generate](#generate)
- **transform** _{Boolean}_ - `true`: Toggle to `false` to cancel modifying values - see [Design:transforms](#transforms)
- **protect** - _{Boolean}_ - `false`: Disables protected model fields (ie. allows overwriting them). Use carefully.
- **strip** - _{Array}_ - `[]`: Remove matching field values from `data`
- **mapIdFrom** - _{String}_ - `undefined`: Maps a primary key field from the field name provided (requires a `primaryKey` field set on the schema)

Format applies these options in significant order:

1. `sparse`: Only processes keys on the provided data (not the whole schema)
2. `defaults`: Apply default values
3. `generate`: Compute and apply generated values
4. `transform`: Run transform functions on values
5. `strip`: Removes matching field values after all other formatting
6. `mapIdFrom`: Sets the id field on data to be on the 'primaryKey'

Meaning if you have an uppercase transform, it will run AFTER your generate methods, thus uppercasing whatever they produce.

Format examples:

```js
const myModel = {
  mod_id: {primaryKey: true},
  rando: {generate: {ops: Math.random, once:true}},
  power: {default: 5},
  name: {default: 'zim', transforms:['uppercase']}
};

let out = Skematic.format(myModel, {}, {generate: 'once'})
// -> {rando: 0.24123545, power: 5, name: 'ZIM'}

out = Skematic.format(myModel, {}) // (schema, data)
// -> {power: 5, name: 'ZIM}

out = Skematic.format(myModel, {}, {defaults: false})
// -> {}

out = Skematic.format(myModel, {rando: undefined, power: 'x'}, {strip: [undefined, 'x']})
// -> {name: 'ZIM'}

out = Skematic.format(myModel, {name: 'Gir'}, {sparse: true})
// -> {name: 'GIR'}

out = Skematic.format(myModel, {_id: '12345'}, {mapIdFrom: '_id'})
// -> {mod_id: '12345', power: 5, name: 'ZIM'}
```


### createFrom

![status:unstable](https://img.shields.io/badge/status-unstable-orange.svg?style=flat-square)

> Likely to be subsumed into `format()` as a flag. See [Issue #18](https://github.com/mekanika/skematic/issues/18)

The convenience method `.createFrom( schema )` generates an object based on all the fields in the provided `schema`, and otherwise runs through `.format()` with default flags set - in other words, the new object gets defaults, generators and transforms applied.

In many ways it is similar to passing a blank data object to `.format( schema, {} )`, except every field on schema gets intialised to `undefined` unless overridden by a `default` or a `generate` method.

```js
const mySchema = {
  name: {type: 'string'},
  power: {default: 5},
  rnd: {generate: Math.random}
}

Skematic.createFrom(mySchema)
// -> {name: undefined, power: 5, rnd:0.4125...}
```


## Validate

Validation applies any [rules](#rules) specified in the `schema` fields to the provided `data` and returns an object `{valid, errors}`:

```js
Skematic.validate(schema, data [, opts])
// -> {valid: <Boolean>, errors: {$key: [errors<String>]} | null}
```

Parameters:

- **schema**: The schema to validate against
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

- **sparse** _{Boolean}_ `false`: Only process fields on the provided data, rather than all fields on the entire schema
- **keyCheckOnly** _{Boolean}_ `false`: **Overrides normal validation** and ONLY checks user data keys are all defined on schema. Useful to ensure user is not sending bogus keys. @see [Format options: `strict`](#format) to simply strip unknown keys.



## Development

`Skematic` is written in **ES6+**.

Developing Skemetic requires installing all dependencies:

    npm install

Run the tests:

    npm test

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

Copyright 2016 [@cayuu](https://github.com/cayuu)
v2+ Released under the **ISC License** ([ISC](https://opensource.org/licenses/ISC))
