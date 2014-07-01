# schema

Describes the _structure_ of a data model.

## Overview

At its core a "schema" is a _named_ (by `key`) set of  [**Properties**](https://github.com/mekanika/property) (and optionally, Methods). Properties prescribe:

- Type for **Casting** (including casting arrays)
- Rules for **Validation**

The structure of a schema, represented in JSON:
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

The `.resource` is particularly important. It is automatically derived by lowercasing the `.key` (and can be overridden) and is used as the identifier for the resource when calling an adapter (useful if your data source specifies a resource for this model using a different name eg. `schema('player') -> {resource: 'users'}`).

### Goals

The `schema` library provides several core functions:

1. A simple, standard structure **definition for "schema"**
2. A **fluent API for creating** new schema
3. **JSON import/export** tool
4. A wrapper 'accessor' with tools for **managing an App's schema**


## Basics

  Create a schema:

```js
schema.new('Hero') // -> new Schema#
// You can assign this if you prefer using the accessor (now that it's created)
var Hero = schema( 'Hero' );
```

  Set some properties and methods on it:

```js
Hero // or simply use `schema('Hero').prop(...`
  .prop( 'name' )
  .prop( 'tagline' )
  .method( 'speak', function( enemy ) {
    return 'Halt '+enemy+'! '+this.tagline;
    });
```


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

## Properties

  A schema may have [properties](https://github.com/mekanika/property) (attributes). These are created as:

```js
schema( 'Weapon' )
  .prop( name, options );
```

  Also available as aliases: `.property()` or `.attr()`

  For more details, see [mekanika-property](https://github.com/mekanika/property).

### Options

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

#### A note on Types

In addition to the standard cast types specified above, a property can be cast to a Schema type (essentially, a complex object). For example:

```js
// Declare a model schema
schema('Rock').prop('weight').prop('grade');
// Assign the child model to another schema property type
schema('House').prop('rocktype', {type:'Rock'});
```

All the schema validations and checks assigned to the child schema (`Rock`) will be correctly cast and enforced when the parent (`House`) is created, or has any of its validation routines called.

### Validating on the fly

You can validate arbitrary data against a property definition. Just call `schema#validate( propertyKey, value )` (returns array of errors - empty if none):

```js

var Rock = schema('Rock').prop('name', {required:true});

Rock.validate( 'name', undefined );
// -> ["Property is required"]

Rock.validate( 'name', 'Star' );
// -> []
```


## Validators

> Validation happens at the Record Property level, which is handled by [mekanika-property](https://github.com/mekanika/property).
>
> For the definitive guide, see **[Property Validation](https://github.com/mekanika/property#validation)**.

`schema` provides several built in validation rules (via `schema.validators`) that you can apply when declaring properties. Notably, 'required' is passed as a property option, rather than a rule. The other available validators are (shown with the parameters necessary to be set on declaring the rule - see below for how validator objects are composed):

- **.min** - `limit:[val]` The lowest permitted number
- **.max** - `limit:[val]` The highest permitted number
- **.between** - `limit:[val]` Value falls between
- **.minLength** - `limit:[val]` The shortest string permitted
- **.maxLength** - `limit:[val]` The longest string permitted
- **.betweenLength** - `limit:[val]` String length falls between
- **.isEmail** - no parameters: Is the string an email
- **.isUrl** - no parameters: Is the string a URL
- **.regex** - `limit:[regexp]` String must matche regexp
- **.notRegex** - `limit:[regexp]` String must NOT match regexp

Property validators are functions that are passed a `value` to be conditionally evaluated, and return either `true` or `false`. A simple validator takes the form:

```js
function duckCheck( value ) {
  return value === 'Duck';
}
```

In this example the validator (also known as a `rule`), simply tests whether the value is equivalent to the string `Duck`.

Assign `validators` as an array when you declare a property as follows:

```js
schema('Rockstar')
  .prop('name', validators:[ {rule: duckCheck} ] );
```

Or using one of the built in validators:

```js
schema('Rockstar')
  .prop('name', validators:[ {rule: schema.validators.maxLength, limits: [25]} ] );
```

Validator objects are comprised as:

```js
{ rule: fn, errorMsg: 'message', limits: [] }
```

  - **rule**: The function to run. Passed `value` as its first parameter as well as each element in (the optional) `limits` array, in order. Rules _MUST_ return a true or false to be validators.
  - **errorMsg**: A custom error message if validation fails.
  - **limits**: Parameter values to be passed to the rule. Useful when you wish to compare the `value` to something.

Limits are used when **declaring** a validator:

```js
schema('Rockstar')
  .prop('name', {validators:[
    {
      rule: function minimum(value, min, b) {
        console.log( b );
        // -> 'woo!'

        return value >= min;
        },
      errorMsg: '',
      limits:[ 10, 'woo!' ]
    }
  ]});
```

The `limits` property is an _array of values_ that are passed in order of declaration as arguments to the rule. In the above example, the rule would test whether the value was at least `10`.
