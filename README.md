# Skematic

> Note: `Skematic` used to be called `mekanika-schema` (changed 19 March 2015)

> Data structure and rule validation engine

> _In Development_: Skematic is still **beta software**. It has matured in terms of its test coverage and stability, however the API should not be considered stable and is likely to introduce breaking changes prior to a Release Candidate. See [Ticket #3: Lock down API design](https://github.com/mekanika/schema/issues/3)

`Skematic` enables you to design and format data structures according to rules and conditions.

- **Validate**: ensure arbitrary data conforms to rules
- **Format**: reformat data structures based on conditions
  - Cast inputs to specific types
  - Transform strings (strip whitespace, etc)
  - Initialise object value defaults


Example use:

```js
var Skematic = require('skematic');

// Load in functions for Skematic to use
Skematic.loadLib({
  randomChar: function () {
    return Math.random().toString(36).substr(2);
  }
});

// Setup a data structure ruleset
var ref = {
  name: {
    type: 'string',
    default: 'Zim',
    rules: {minLength:3},
    errors: {minLength:'Too short man!'}
   },
  password: {
    required:true, 
    generate: { ops:[{fn:'randomChar'}] }
    }
  }
};

Skematic.createFrom( ref );
// {name:'Zim', password:'c92jkvld10'}

Skematic.validate( {name:'X!'}, ref );
// -> {valid:false, errors:{name:['Too short man!']}}
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


## Basic Usage

```js
// Include Mekanika Skematic module
var Skematic = require('skematic');

// Declare a data schema
var Hero = {
  name: {type:'string'},
  power:{type:'number'}
};

// Create your object
var clark = {name:'Superman', power:12};

// Validate your object against the data schema
var results = Skematic.validate( clark, Hero );
// returns --> {valid:true, errors:{}}
```

_Note:_ Specifying a `type` is shorthand for adding the rule `is:'$type'`. If you plan to CAST to this type you'll need a filter. For more details on usage, see below.


## Config reference

A data structure 'skematic' is simply a hash of keys, each key representing a field in your data structure. Each field may optionally have rules attached to it, but this is not required. As such, the simplest structure looks as follows:

```js
// Your object has only a "name" field
var myStruct = { name: {} };
```

With no rules, validate will always pass, and initialising a new object from this structure will appear as follows:

```js
Skematic.validate( {/*any data*/}, myStruct );
// -> {valid:true, errors:{}}

Skematic.createFrom( myStruct );
// -> {name: undefined}
```

To define a data structure (a 'skematic'), use the following rules:

- **type** _{String}_ Checks (but doesn't convert) that a value is of type:
    - "string"
    - "boolean"
    - "number"
    - "integer"
    - "array"
    - "object"
- **default** _{any}_ value to apply if no value is set/passed
- **transforms** _{Array}_ string values of transform to apply (transforms)
- **required** _{Boolean}_ flag if property MUST be set and/or provided
- **rules** _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }` (see below for more)
- **errors** _{Object|String}_ hash of error messages for rules
- **schema** _{Object|String}_ declare sub-schema defining this value (see "Sub-schema")
- **generate** _{Object}_ enables computing a value from functions

> Note: As you can see, keys that can contain many values are always plural, eg. `transforms`, `rules`, etc. Keys that only contain one value or item are always singular, eg. `default`, `required`, `schema`, etc.


### A working example

A working example of the configuration options is provided below as code.
Remember, all structure rules and definitions are _optional_.

```js
var Schema = {
  
  // A key you wish to provide on your data structure, in this case: "name"
  name: {
    // Acts as a Rule - fails validation if passed something other than
    // a "string", unless transformed using `toString`
    type: 'string',

    // Acts as a Rule - fails if not provided
    required: true,

    // Formats data - if no value is provided, value is set to this default
    default: 'User',

    // Formats data - applies modification functions. See "Transforms" in docs
    transform: ['toString', 'trim'],

    // Rules for validation
    // See the "Rules" docs for more information
    rules: {
      minLength: 3,
      maxLength: 32
    },

    // Custom error messages for rule validation failures
    errors: {
      // Specific to the `minLength` error
      minLength: 'Name must be at least 3 characters',
      // Applies to any failures that do not have a declared error message
      // (Note: if no `default` is specifed, errors return 'Failed: <rule>')
      default: 'Name validation failed'
    }
  },

  magicNumber: {
    type:'number',

    // Formats data - generates a computed value for this field `magicNumber`
    generate: {
      // The "ops" are named functions that are run one after the other
      // with the output of each fed as the first parameter of the next call
      // - Requires loading a named library of functions using `.loadLib()`
      ops: ['randomNumber'],

      // Can only be run when the `once` flag is specified on `.compute()`
      once: true,

      // Whether a provided value should be kept (false = overridden)
      // Default: false (ie. no _need_ to specify this below, but for example)
      preserve: false,

      // If true, a `magicNumber` key MUST be present on the provided data
      // in order to generate a new value. `false` means always generate
      // Default: false (ie. no _need_ to specify this below, but for example)
      require: false
    }
  },

  stringCode: {
    type: 'array',

    // This structure applies to the contents of the `stringCode` Array
    schema: {
      type: 'string',
      // Ensures the values in `stringCode` array are all one of these 
      rules: {in:['one','two','three','four','five']},
      errors: {
        in: 'stringCodes MUST be a string number between "one" and "five"'
      }
    }
  },

  special: {
    // This structure applies directly to the `special` property object
    schema: {
      style: {type:'string', rules:{in: ['work','play'] }},
      power: {type:'number', default:5}
    }
  }
}
```



Example:

```js
var HeroName = {
  type:'string',
  default: 'Genericman',
  transforms: ['toString','nowhite'],
  required: true,
  rules: {maxLength:140, minLength:4},
  errors: {maxLength:'Too long', minLength:'Shorty!'}
};

Skematic.validate('Spiderman', HeroName);
// -> {valid:true, errors:[]}
Skematic.validate('Moo', HeroName);
// -> {valid:false, errors:[]}
```

Data structure can also be objects of properties:

```js
var Hero = {
  name: HeroName,
  skill: {type:'number', default:0}
};

Skematic.validate( {name:'Spiderman', skill:15} );
// -> {valid:true, errors:{}}
// (note the `errors` in this case is an object)

```

## API

The *primary* method is:

- **.validate( d,s )** - Rule validation engine (see "Rules"). Returns `{ valid: true/false, errors: {} }`

You may alternatively validate ONLY the fields on the data object (rather than the entire schema), by running `sparseValidate` as follows:

```js
Skematic.sparseValidate({simple:true}, complexStruct);
```

To format data, use `format( schema, opts, data )`:

```js
Skematic.format( schema, {
  // Only process keys on the `data` object (rather than the whole schema)
  sparse: true,   // default: false

  // Apply any default values
  defaults: true, // default: true

  // Compute and apply generated values
  generate: true, // default: true

  // Run tranform functions on values
  transform: true, // default: true
}, data );
```

Format applies these options in significant order:

1. `sparse`: Only processes keys on the provided data (not the whole schema)
2. `defaults`: Apply default values
3. `generate`: Compute and apply generated values
4. `transform`: Run tranform functions on values

Meaning if you have an `uppercase` transform, it will run AFTER your `generate` methods, thus uppercasing whatever they produce.

You may also manually invoke the individual methods:

- **.default( d,s )**  - Returns/applies defaults if no value provided
- **.compute( d,s )** - Generates a value (see "Computed Values")
- **.transform( d,s)


> `(d,s)` is shorthand for `(data, schema)` parameters.
>
> The `d` (data) parameter is either a scalar value or an object of `{key:value}` pairs. If passing a data object, ensure you provide the `s` (schema) parameter as an object hash with the keys you wish to test.

To optionally create a blank object from your schema:

- **createFrom( schema )** - generates a blank object from the provided `schema` running `.default()` and `.compute()`.

Additional methods:

- **.checkValue( val, schema )** - runs rule validation against a value - returns an array of errors.

- **.transform( value, transforms )**   - Applies `transforms` array to `value`
  - .transform.available() - lists available transforms
  - .transform.add( key, fn ) - adds a transform to the library



```

## Transforms

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


## Rules

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
}

Skematic.validate( 'Zim', User.name );
// -> {valid:false, errors:['Failed: minLength']}
```


### Custom **error** messages

Custom error messages can be declared per rule name:
`{errors: { "$ruleName": "Custom message" }}`

Provide a default message if no specific error message exists for that rule:

```js
{
  errors: {
    max:'Too long',
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
}

// Using a "scalar" value test:
Skematic.validate( 'Zim', User.name );
// -> {valid:false, errors:['Name too short!']}

// Using a keyed object value test:
Skematic.validate( {name:'Zim'}, User );
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

## Computed values

Skematic keys can **generate** values using the `generate` directive.

> **todo** more docs :)

```js
// Load in a keyed function library
Skematic.loadLib({
  magic: function () {
    // Generates a random string of characters
    return Math.random().toString(36).substr(2);
  }
});

// Our example data structure
var example = {
  rando: {
    generate: {
      // Array of functions to run from our library
      ops:[{fn:'magic'}],
      // Optional flag: preserves a provided value
      preserve: true,
      // Optional flag: ONLY generate if provided
      require: false
    }
  }
};

Skematic.createFrom(example);
// -> {rando:'df9vkd14h'}
```


## A note on **sub-schema**

A property can be cast to another schema (essentially, a complex object), or array of schema.

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
  url: {type:'string', filter:'toUrl'},
  tags: {type:'array', schema:{type:'string', rules:{minLength:3}}}
}
```

All the schema validations and checks assigned to the sub-schema (`comments`) will be correctly cast and enforced when the parent (`post`) has any of its validation routines called.

#### Sub-schema by string reference (using **accessor()**)

When storing schema data structures as JSON, it can be handy to reference definitions by String (rather than as raw functions):

```js
var allTheSkematic = {
  Taste: {
    major: {rules:{in:['sweet','sour','salty','other']}},
    description: {type:'string'}
  },

  Jellybean: {
    // Reference by String
    taste: {schema:'Taste'}
  }
};
```

To access string references, pass in a function to `Skematic.accessor( myLookupFn )`

```js
Skematic.accessor(function myAccessor (ref) {
  // Allow Skematic to load string `ref` from our definitions
  return allTheSkematic[ ref ];
});
```



## License

Copyright 2013-2015 Mekanika

Released under the **Mozilla Public License v2.0** ([MPLv2](http://mozilla.org/MPL/2.0/))
