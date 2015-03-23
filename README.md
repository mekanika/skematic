# Skematic

**Data structure** and **rule validation engine**. Robust schema for JS objects.

> IMPORTANT: Upcoming [**v1.0 Release Candidate milestone**](https://github.com/mekanika/skematic/milestones/v1.0%20-%20Release%20Candidate)
>
> After a major API update in v0.13 (see [HISTORY.md](https://github.com/mekanika/skematic/blob/master/HISTORY.md#0130---22-march-2015) for changes) and renaming the project from `mekanika-schema` to `skematic`, this library is now aiming for v1.0 release candidate. 
>
> The API status is considered **STABLE** (no breaking changes, bug-fixes only) and can now be implemented without breaking changes leading to 1.0.

Isomorphic, fast and lightweight (~9.5Kb), `Skematic` enables you to _design_, _format_ and _validate_ data according to rules and conditions specified as simple config objects, for browser and node/iojs.

- [**Design**](#design): structure your data models as config objects
- [**Format**](#format): transform, generate and modify data structures
- [**Validate**](#validate): check that arbitrary data conforms to rules

A very **basic example**:
```js
// -- Define a simple data structure
var Hero = {
  name:    {rules:{minLength:4}, errors:'Bad name!'},
  shouts:  {transforms:['trim', 'uppercase']},
  skill:   {type:'number', default:3, required:true},
  updated: {generate:{ops:myTime}}
};

// -- Format some data
Skematic.format( Hero, {shouts:' woo  '} );
// {shouts:'WOO', skill:3, updated:1426937159385}

// -- Validate an object
Skematic.validate( Hero, {name:'Zim'} );
// {valid:false, 
//  errors:{
//    name: 'Bad name!',
//    skill: 'Required to be set'
// }}
```

## Install

    npm install skematic

To use in CommonJS (node/iojs) environments:

```js
var Skematic = require('skematic');
```

To use in a browser:

```html
<script src="node_modules/skematic/build/skematic.min.js"></script>
```

> **Compatibility Note:** `Skematic` is written in ES5 and works across _all modern browsers_ (IE9+, Chrome, Firefox, Safari evergreens). 
> Please note that the ES5 `Object.keys()` method is not supported by IE7 & 8, so to use `Skematic` in these fossil browsers, you'll need to install [es5-shim](https://github.com/es-shims/es5-shim) (and worship Satan :metal:).

## API

The API surface is small by design, with two **primary methods**:

- **.format**( schema, [opts,] data )  - see [Format](#format)
- **.validate**( schema, [opts,] data )  - see [Validate](#validate)

A few other **convenience methods** are provided, that mostly encapsulate or expose specific functionality in format or validate:

- **.createFrom**( schema ) - _generate an object from schema definitions_ - see [createFrom](#createfrom)

Optional setup methods:

- **.useGenerators**( fnObj ) - _hash of functions used to generate values_ - see [Format:generate](#generate)
- **.useSchemas**( schemas )  - _hash of schemas for lookup by string_ - see [Design:sub-schema](#sub-schema)


## Design

### Schema configuration 

`Skematic` provides keys to define rules and conditions for your data. Config keys are **all optional**, so the empty object `{}` is perfectly valid (even if it doesn't do anything).

- **type** _{String}_ Specify a _rule_ that value is type:
    - "string"
    - "boolean"
    - "number"
    - "integer"
    - "array"
    - "object"
- **default** _{any}_ value to apply if no value is set/passed
- [**transforms**](#transforms) _{Array}_ string values of transform to apply (transforms)
- [**generate**](#generate) _{Object}_ enables computing a value from functions
- **required** _{Boolean}_ flag if property MUST be set and/or provided
- [**rules**](#rules) _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }`
- [**errors**](#custom-error-messages) _{Object|String}_ hash of error messages for rules
- [**schema**](#sub-schema) _{Object|String}_ declare sub-schema defining this value (see "Sub-schema")

> Note: As you can see, keys that can contain many values are always plural, eg. `transforms`, `rules`, etc. Keys that only contain one value or item are always singular, eg. `default`, `required`, `schema`, etc.


### `$dynamic` keys

In some cases it is useful to apply the same schema to all the fields on an object (or sub-object), even if you don't know what those key names are. In this case, specify **`$dynamic`** rather than the field name:

```js
var KnownKeys = {
  propA: {default:'sweet', required:true},
  propB: {default:'sweet', required:true} // etc etc
};

var Dynamic = {
  $dynamic: {default:'sweet', required:true}
};
```

The `$dynamic` key will apply to _every_ field on your object at the level you specify, and `Skematic` will not process any other declared rules. Place `$dynamic` keys anywhere you'd use a normal field name:

```js
var MoreNested = {
  props: {
    schema: {
      $dynamic: {
        schema: {
          value: {default:'!', required:true}
        },
        default:{}
      }
    },
    default: {}
  }
};

Skematic.format( MoreNested, {props:{randCrazy:undefined}} );
// -> { props: { randCrazy: { value: '!' } } }

Skematic.validate( MoreNested, {props:{ crazy:{} }});
// -> { valid:false, errors:{props:{crazy:['Required to be set']}} }

Skematic.validate( MoreNested, {props:{ crazy:{value:99} }});
// -> { valid:true, errors:null }
```


### Simple examples

A data model for a single key (eg. `name`):

```js
var HeroName = {
  type:'string',
  default: 'Genericman',
  transforms: ['toString','nowhite'],
  required: true,
  rules: {maxLength:140, minLength:4},
  errors: {maxLength:'Too long', minLength:'Shorty!'}
};

Skematic.validate( HeroName, 'Spiderman' );
// -> {valid:true, errors:null}
Skematic.validate( HeroName, 'Moo' );
// -> {valid:false, errors:['Shorty!']]}
```

Typically you'll create a more complete data model to represent your application objects, with several fields to format and validate:

```js
var Hero = {
  name: HeroName,
  skill: {type:'number', default:0}
};

Skematic.validate( Hero, {name:'Spiderman', skill:15} );
// -> {valid:true, errors:null}
Skematic.validate( Hero, {name:'Moo', skill:'magic'} );
// -> {valid:false, errors:{name:['Shorty!'], skill:['Not of type: number']}}
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
- **toDate** - converts value to a Javascript Date

These are provided as an array on key `transforms`:

```js
var mySchema = {
  handle: {transforms:['trim', 'lowercase']}
};
```

### Rules

Several validation rules are built in. Notably, 'required' is passed as a property option, rather than a rule. The other available validators are:

- **.min** - The lowest permitted number
- **.max** - The highest permitted number
- **.minLength** - The shortest string permitted
- **.maxLength** - The longest string permitted
- **.in** - Value must be in the list of elements
- **.notIn** - Value must NOT be in the list of elements
- **.has** - List of elements contains the value
- **.hasNot** - List of elements does NOT contain the value
- **.isEmail** - no parameters: Is the string an email
- **.isUrl** - no parameters: Is the string a URL
- **.match** - String must match regexp
- **.notMatch** - String must NOT match regexp
- **.empty** - `true` checks the value is empty, `false` checks it's not

Declare `rules` key as follows:

```js
var User = {
  name: {
    rules: {minLength:5}
  }
};

Skematic.validate( User.name, 'Zim' );
// -> {valid:false, errors:['Failed: minLength']}
```

### Custom **error** messages

Custom error messages can be declared per rule name:
`{errors: { "$ruleName": "Custom message" }}`

Provide a default message if no specific error message exists for that rule:

```js
{
  errors: {
    max:'Too large',
    default:'Validation failed'
  }
}
```

Usage example :

```js
var User = {
  name: {
    rules: {minLength:5},
    errors: {minLength:'Name too short!'}
  }
};

// Using a "scalar" value test:
Skematic.validate( User.name, 'Zim' );
// -> {valid:false, errors:['Name too short!']}

// Using a keyed object value test:
Skematic.validate( User,  {name:'Zim'} );
// -> {valid:false, errors:{name:['Name too short!']}}
```

Rules can be combined, and you can declare a string message on errors to apply to any and all errors:

```js
var user = {
  name: {
    rules: {minLength:5, maxLength:10},
    errors: 'Name must be between 5 and 10 characters'
  }
}
```

### Generate

**Computed values** - `Skematic` keys can generate values using functions referenced in the `generate` directive.

The `generate` field has the following properties:

- **ops** _{Array}_ of fn objects `{fn [, args])` or functions. The output of each function is passed as the first parameter of the next.
- **preserve** _{Boolean}_ `false`: OPTIONAL Preserves a provided value and does not overwrite unless set to `true`.
- **require** _{Boolean_ `false`: OPTIONAL Ensures that value is only generated if the field exists on the provided data. 
- **once** _{Boolean}_ `false`: OPTIONAL Flag this field to only generate if `.format()` is called with the option `once:true`. Useful for fields like "created".

> Unless instructed otherwise (via flags) generate will compute a value _every_ time and _overwrite_ any provided value. To preserve any provided value set `preserve: true`. To _only_ generate a value when the key for that field is provided, set `require: true`. To ensure a generator is only run when you pass a `{generate:'once'}` to format(), set the `once: true` flag.

Example: 

```js
var Hero = {
  updated: {
    // This is our "generate" field
    generate: {
      // The ops array lists fn objects or functions
      ops:[
        // A fn object specifies `fn` and `args`
        {fn: myFunc, args:[]},
        // , {fn...}, etc etc
        // And here is a raw function with no args
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
var Hero = {
  updated: {generate:{ops:[myFunc,anotherFn]}}
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
});

// Reference a generator by STRING: 'magic'
var SpinModel = {
  rando: { generate: {ops:[{fn:'magic'}]} }
};

Skematic.createFrom(SpinModel);
// -> {rando:'5wyml04ey1xos9k9'}
```

### Sub-schema

A property can be formatted to another schema (essentially, a complex object), or array of schema.

```js
// A "post" would have comments made up of `owner_id, body`
var post = {
  comments: { type:'array', schema: {
    owner_id: {type:'number'},
    body: {type:'string', rules:{minLength:25}}
    }
  }
}

// Or, a simple scalar array of "tags" (an array of strings):
var picture = {
  url: {type:'string'},
  tags: {type:'array', schema:{type:'string', rules:{minLength:3}}}
}
```

All the schema validations and checks assigned to the sub-schema (`comments`) will be correctly cast and enforced when the parent (`post`) has any of its validation routines called.

#### Schema by string reference - **`useSchemas()`**

When storing schema data structures as JSON, it can be handy to reference definitions by String (rather than as objects):

```js
var allMyModels = {
  Taste: {
    major: {rules:{in:['sweet','sour','salty','other']}},
    description: {type:'string'}
  },

  Jellybean: {
    // Reference by String
    taste: {schema:'Taste'}
  }
};

// Tell Skematic to lookup string references on this object
Skematic.useSchemas( allMyModels );
```


## Format

Format transforms, generates and conforms data (in place - ie. destructively changes `data`):

```js
Skematic.format( schema, [opts,] data );
```

Parameters:

- **schema**: The schema to format against
- **opts**: _[Optional]_ options hash (see below)
- **data**: The data object to format

```js
Skematic.format( Hero, {name:'Zim'} );

// Or with options
Skematic.format( Hero, {sparse:true}, {name:'Zim'} );
```

Format _options_ include:

Legend: **field** - _{Type}_ - `default`: Description

- **sparse** - _{Boolean}_ - `false`: Only process fields on the provided data, rather than all fields on the entire schema
- **defaults** - _{Boolean}_ - `true`: Set default values on 'empty' fields
- **generate** - _{Boolean|"once"}_ - `true`: Compute a new value (setting as `"once"` will _also_ compute for fields flagged as "once") - see [Design:generate](#generate)
- **transform** - modify values - see [Design:transforms](#transforms)

Format applies these options in significant order:

1. `sparse`: Only processes keys on the provided data (not the whole schema)
2. `defaults`: Apply default values
3. `generate`: Compute and apply generated values
4. `transform`: Run transform functions on values

Meaning if you have an uppercase transform, it will run AFTER your generate methods, thus uppercasing whatever they produce.

Format example:

```js
var myModel = {
  rando: { generate:{ops:[{fn:'makeRand'}], once:true} },
  power: {default: 5},
  name: {default: 'zim', transforms:['uppercase']}
};

var out = Skematic.format( myModel, {generate:'once'}, {} );
// -> {created:'12345', power:5, name:'ZIM'}
out = Skematic.format( myModel, {} ); // (schema, data)
// -> {rando:undefined, power:5, name:'ZIM}
out = Skematic.format( myModel, {defaults:false}, {} );
// -> {random:undefined, power:undefined, name:undefined}
out = Skematic.format( myModel, {sparse:true}, {name:'Gir'} );
// -> {name:'GIR'}
```


### createFrom

The convenience method `.createFrom( schema )` generates an object based on all the fields in the provided `schema`, and otherwise runs through `.format()` with default flags set - in other words, the new object gets defaults, generators and transforms applied.

In many ways it is similar to passing a blank data object to `.format( schema, {} )`, except every field on schema gets intialised to `undefined` unless overridden by a `default` or a `generate` method.

```js
var mySchema = {
  name: {type:'string'},
  power: {default:5},
  rnd: {generate:{ops:[Math.random]}}
};

Skematic.createFrom( mySchema );
// -> {name: undefined, power: 5, rnd:0.4125...}
```


## Validate

Validation applies any [rules](#rules) specified in the `schema` fields to the provided `data` and returns an object `{valid, errors}`:

```js
Skematic.validate( schema, [opts,] data );
```

Parameters:

- **schema**: The schema to validate against
- **opts**: _[Optional]_ options hash (see below)
- **data**: The data object to validate

```js
Skematic.validate( Hero, {name:'Zim'} );

// Or with options
Skematic.validate( Hero, {sparse:true}, {name:'Zim'} );
```

Returns an object `{valid: $boolean, errors: $object|$array|null}` where the `errors` key may be:

- `null` - no errors
- `array` - of errors if validating a scalar (string, number, etc)
- `object` - hash of errors when validating a data object

Validate _options_ include:

Legend: **field** - _{Type}_ - `default`: Description

- **sparse** _{Boolean}_ `false`: Only process fields on the provided data, rather than all fields on the entire schema



## Development

`Skematic` is currently written in **ES5**.

Run the tests:

    npm test

**Benchmarks:** The `perf/benchmark.js` is simply a check to ensure you haven't destroyed performance: `npm run benchmark`. Skematic runs at several tens of thousands of complex validations per second on basic hardware.

### Contributions

Contributions to `Skematic` are welcome.

- Maintain the existing code style conventions
- Ensure your code passes JSHint `npm run lint`
- Include tests that fail without your code, and pass with it
- Add documentation (JSDoc for functions, README updates, etc)
- Open a pull request

### License 

`Skematic` is maintained and released by [Mekanika](http://mekanika.org)

![Mekanika](http://mekanika.org/assets/external/readme.logotag.png)

Copyright 2013-2015 Mekanika

Released under the **Mozilla Public License v2.0** ([MPL-2.0](http://mozilla.org/MPL/2.0/))
