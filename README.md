# Schema

> Data structure and rule declaration engine


## Install

    npm install mekanika-schema


## Basic Usage

```js
// Include Mekanika Schema module
var Schema = require('mekanika-schema');

// Declare a data schema
var Hero = {
  name: {type:'string'}, 
  power:{type:'number'}
};

// Create your object
var clark = {name:'Superman', power:12};

// Validate your object against the data schema
var results = Schema.validate( clark, Hero );
// returns --> {valid:true, errors:{}}
```

_Note:_ Specifying a `type` is shorthand for adding the rule `is:'$type'`. If you plan to CAST to this type you'll need a filter. For more details on usage, see below.


## API

The *primary* schema method is:

- **.validate( d,s )** - Rule validation engine (see "Rules"). Returns `{ valid: true/false, errors: {} }`

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


- **.filter( value, filters )**   - Applies `filters` array to `value`
  - .filter.available() - lists available filters
  - .filter.add( key, fn ) - adds a filter to the library


## Schema Structure

To define a data structure (a schema), use the following:

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
- **rules** _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }`
- **errors** _{Object|String}_ hash of error messages for rules
- **schema** _{Object|String}_ declare sub-schema defining this value (see "Sub-schema")

Example:

```js
var HeroName = {
  type:'string',
  default: 'Genericman',
  filters: 'toString nowhite',
  required: true,
  rules: {maxLength:140, minLength:1},
  errors: {maxLength:'Too long', minLength:'Shorty!'}
};

Schema.validate('Spiderman', HeroName);
// -> {valid:true, errors:[]}
```

Schema can also be objects of properties:

```js
var Hero = {
  name: HeroName,
  skill: {type:'number', default:0}
};

Schema.validate( {name:'Spiderman', skill:15} );
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

Schema.validate( 'Zim', User.name );
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
Schema.validate( 'Zim', User.name );
// -> {valid:false, errors:['Name too short!']}

// Using a keyed object value test:
Schema.validate( {name:'Zim'}, User );
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

#### Sub-schema by reference (using **accessor()**)

Reference sub-schema by String by overwriting the `schema.accessor(ref)` method to return **schema**. Enables referencing schema as follows:

    var Jellybean = {taste: {schema:'Taste'}};

This is handy if you're re-using definitions across multiple schema. Requires providing an accessor method that receives the String reference and returns a schema:

```
schema.accessor = function myAccessor (ref) {
  return mySchemaCache[ ref ];
};
```



## License

Copyright 2013-2015 Clint Walker

Released under the **Mozilla Public License v2.0** ([MPLv2](http://mozilla.org/MPL/2.0/))


