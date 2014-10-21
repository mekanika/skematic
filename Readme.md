# schema

Data structure and rule engine.


## Structure

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

Example:

```js
var myProperty = {
  type:'string',
  default: 'Hello world',
  filters: 'toString nowhite',
  required: true,
  rules: {maxLength:140, minLength:1},
  errors: {maxLength:'Too long', minLength:'Shorty!'}
};
```

Schema can also be objects of properties:

```js
var complexObject = {
  name: {type:'string', required:true},
  skill: {type:'number', default:0}
};
```

### A note on **sub-schema**

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


## Methods

0. .default()   - Returns/Applies defaults if no value
1. .filter()    - Run filters to transform the value (including casting)
2. .typeCheck() - Check value matches expected 'type'
3. .test()      - Apply any rules to validate content

.validate() runs all the above and returns:

```
{
  valid: true/false // Did all the rules and checks pass
  errors: [],       // Array of errors
  value: $          // The cast, filtered (or default) value
}
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


## License

Copyright 2013-2014 Clint Walker

Licensed under [LGPL-3.0](http://opensource.org/licenses/LGPL-3.0)

