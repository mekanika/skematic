# Skematic

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
    default: 'Zim'
   },
  password: {
    required:true, 
    generate: { ops:[{fn:'randomChar'}] }
    }
  }
};

Skematic.createFrom( ref );
// {name:'Zim', password:'c92jkvld10'}
```

> Note: `Skematic` used to be called `mekanika-schema` (as of 19 March 2015)


## Install

    npm install skematic

To use in CommonJS (node/iojs) environments:

```js
var Skematic = require('skematic');
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


## API

The *primary* method is:

- **.validate( d,s )** - Rule validation engine (see "Rules"). Returns `{ valid: true/false, errors: {} }`

You may alternatively validate ONLY the fields on the data object (rather than the entire schema), by running `sparseValidate` as follows:

```js
Skematic.sparseValidate({simple:true}, complexStruct);
```

To assist in preparing your data:

- **.default( d,s )**  - Returns/applies defaults if no value provided
- **.compute( d,s,fns )** - Generates a value (see "Computed Values")
- **.cast( d,s )** - Run filters to transform the value (see "Filters")

> `(d,s)` is shorthand for `(data, schema)` parameters.
>
> The `d` (data) parameter is either a scalar value or an object of `{key:value}` pairs. If passing a data object, ensure you provide the `s` (schema) parameter as an object hash with the keys you wish to test.

To optionally create a blank object from your schema:

- **createFrom( schema )** - generates a blank object from the provided `schema` running `.default()` and `.compute()`.

Additional methods:

- **.checkValue( val, schema )** - runs rule validation against a value - returns an array of errors.

- **.transform( value, filters )**   - Applies `filters` array to `value`
  - .filter.available() - lists available filters
  - .filter.add( key, fn ) - adds a filter to the library


## Skematic Structure

A 'skematic' is simply a hash of keys, each key representing a field in your data structure. Each field may optionally have rules attached to it, but this is not required. As such a simple structure looks as follows:

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
- **filters** _{Array}_ string values of filters to apply (transforms)
- **required** _{Boolean}_ flag if property MUST be set and/or provided
- **rules** _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }` (see below for more)
- **errors** _{Object|String}_ hash of error messages for rules
- **schema** _{Object|String}_ declare sub-schema defining this value (see "Sub-schema")

Example:

```js
var HeroName = {
  type:'string',
  default: 'Genericman',
  filters: 'toString nowhite',
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

## Filters

The following built-in filters can be used to cast and otherwise transform a provided value:

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

Declare rules as follows:

```js
var User = {
  name: {
    rules: {minLength:5}
  }
}

Skematic.validate( 'Zim', User.name );
// -> {valid:false, errors:['Failed: minLength']}
```

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
