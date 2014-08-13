# schema

Describes the _structure_ of a data model.

This library is made up of three components:

- **schema**: A standalone library for declaring complex objects with type checks, filters/transforms and validation rules
- **Model**: A 'resource' that encapsulates properties (schema) and methods, with fields useful for interfacing with a data-source (eg. .idAttribute, .adapter)
- **accessor()**: A 'manager' wrapper for Models that keeps a named cache of declared models and tools to interact with these.


## Overview

At its core a "Model" is a _named_ (by `key`) set of  **schema** (and optionally, Methods). Properties prescribe:

- Type checks
- Default values
- Filters for transforming data (including casting)
- Rules for **Validation**
- Sub-schema declaration for complex properties

The structure of a schema, represented in JSON:
```json
{
  "key": "user",
  "resource": "user",
  "properties": [
    {"key": "username", "type": "string", "required": true},
    {"key": "friends", "type": "array", "hasMany": "user"}
  ],
  "methods": [
    {"key": "uppr", "fn":"function(){ return this.username.toUpperCase(); }"}
  ]
}
```

The `.resource` is particularly important. It is automatically derived by lowercasing the `.key` (and can be overridden) and is used as the identifier for the resource when calling an adapter (useful if your data source specifies a resource for this model using a different name eg. `accessor('player') -> {resource: 'users'}`).

### Goals

The library provides several core functions:

1. A simple, standard structure **definition for "schema"**
2. A **fluent API for creating** new schema
3. **JSON import/export** tool
4. A wrapper 'accessor' with tools for **managing an App's schema**


## Basics

  Create a model:

```js
accessor.new('Hero') // -> new Schema#
// You can assign this if you prefer using the accessor (now that it's created)
var Hero = accessor( 'Hero' );
```

  Set some properties and methods on it:

```js
Hero // or simply use `accessor('Hero').prop(...`
  .prop( 'name' )
  .prop( 'tagline' )
  .method( 'speak', function( enemy ) {
    return 'Halt '+enemy+'! '+this.tagline;
    });
```


## Usage

Access to the library is provided via the `accessor` (rather than directly  to the underlying `Model` class).

`accessor` keeps an internal register of model# instances, an import/load function and some utility methods to track, list and create new Models.

Of primary importance are `.new( key )` and `.load( model )`

- **`.new( key )`** creates a new `Schema` - see [Creating Schema](#creating)
- **`.load( schema )`** loads in schema as JSON or POJO

Other utility methods on the accessor include:

- **`.list()`** _{Array}_ keys of all loaded schema
- **`.has( key )`** _{Boolean}_ is schema `key` loaded
- **`.unload( key )`** removes schema `key` from the internal cache
- **`.reset()`** removes all schema from the internal cache


## Creating Models

Generate a new Model by:

```js
accessor.new( 'user' );
// -> Model { key: 'user' }
```

Subsequently accessible as `accessor( 'user' )`

### Updating the structure

#### Properties
Add new properties:

```js
schema('user').prop( 'username', {required: true} )
```

#### Methods

Add new Methods:

```js
schema( 'user' ).method(
    'uppr',
    function() { return this.username.toUpperCase(); }
);
```

## Properties

  A schema may have properties, declared as schema. These are created as:

```js
schema( 'Weapon' )
  .prop( name, schema );
```

  Also available as aliases: `.property()` or `.attr()`


### Schema

- **type** _{String}_ Checks that a value is of type:
    - "string"
    - "boolean"
    - "number"
    - "integer"
    - "array"
    - "objects"
- **default** _{any}_ value to apply if no value is set/passed
- **filters** _{Array}_ string values of filters to apply (transforms)
- **required** _{Boolean}_ flag if property MUST be set and/or provided
- **rules** _{Object}_ hash of validation rules: `{ rules: {min:3, max:11} }`
- **errors** _{Object|String}_ hash of error messages for rules
- **schema** _{Object|String}_ declare sub-schema defining this value

#### A note on sub-schema

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
```

All the schema validations and checks assigned to the sub-schema (`comments`) will be correctly cast and enforced when the parent (`post`) has any of its validation routines called.

### Validating on the fly

You can validate arbitrary data against a property definition. Just call `schema#validate( propertyKey, value )` (returns array of errors - empty if none):

```js

var Rock = schema('Rock').prop('name', {required:true});

Rock.validate( 'name', undefined );
// -> ["Property is required"]

Rock.validate( 'name', 'Star' );
// -> []
```


## Rules

Several validation rules are built in. Notably, 'required' is passed as a property option, rather than a rule. The other available validators are:

- **.min** - The lowest permitted number
- **.max** - The highest permitted number
- **.minLength** - The shortest string permitted
- **.maxLength** - The longest string permitted
- **.isEmail** - no parameters: Is the string an email
- **.isUrl** - no parameters: Is the string a URL
- **.match** - String must match regexp
- **.notMatch** - String must NOT match regexp
- **.empty** - `true` checks the value is empty, `false` checks it's not

Declare rules as follows:

```js
var user = {
  name: {
    rules: {minLength:5}
  }
}

// schema.test( 'Zim', user.name );
// -> ['Failed: minLength']
```

Custom error messages can be declared per rule name `{errors:{$ruleName:'msg'}}`, and provided a default message if no specific error message exists for that rule `{errors:{max:'Too long', default:'Validation failed'}}`. Finally you can declare a string message on errors to apply to any and all errors `{errors:'Failz'}`.

```js
var user = {
  name: {
    rules: {minLength:5},
    errors: {minLength:'Name too short!'}
  }
}

// schema.test( 'Zim', user.name );
// -> ['Name too short!']
```

Rules can be combined:

```js
var user = {
  name: {
    rules: {minLength:5, maxLength:10},
    errors: 'Name must be between 5 and 10 characters'
  }
}
```

