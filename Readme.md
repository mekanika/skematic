# schema

Describes the _structure_ of a data model.

## Overview

At its core a "schema" is a _named_ (by `key`) set of  [**Properties**](https://github.com/mekanika/property) (and optionally, Methods). Properties prescribe:

- Type for **Casting** (including casting arrays)
- Rules for **Validation**

An example, represented in JSON:
```json
{
  "key": "user",
  "resource": "user",
  "properties": [
    {"key": "username", "type": "string", "required": true},
    {"key": "friends", "array": true, "hasMany": "user"}
  ],
  "methods": [
    {"key": "uppr", "fn":"function(){ return this.username.toUpperCase(); }"}
  ]
}
```

### Goals

The `schema` library provides several core functions:

1. A simple, standard structure **definition for "schema"**
2. A **fluent API for creating** new schema
3. **JSON import/export** tool
4. A wrapper 'accessor' with tools for **managing an App's schema**


## Usage

Access to the library is provided via the accessor `schema` (rather than directly to the underlying Class `Schema`).

`schema` keeps an internal register of schema# instances, an import/load function and some utility methods to track, list and create new schema.

Of primary importance are `.new( key )` and `.load( schema )`

- **`.new( key )`** creates a new `Schema` - see [Creating Schema](#creating)
- **`.load( schema )`** loads in schema as JSON or POJO

Other utility methods on `schema` include:

- **`.list()`** _{Array}_ keys of all loaded schema
- **`.has( key )`** _{Boolean}_ is schema `key` loaded
- **`.unload( key )`** removes schema `key` from the internal cache
- **`.reset()`** removes all schema from the internal cache


## Creating Schema

Generate a new Schema by:

```js
schema.new( 'user' );
// -> Schema { key: 'user' }
```

Subsequently accessible as `schema( 'user' )`

### Updating the structure

#### Properties
Add new properties (see [Property](https://github.com/mekanika/property) for options details):

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

