0.14.0 - 26 March 2015
======

Added:

- `$dynamic` keys to schema config #15
- `strip` flag to .format() to remove matching field values #9
- `copy` flag to .format() to preserve passed 'data'

Fixed:

- .format() now applies schema to objects in arrays
- Falsey defaults do not apply correctly #16

Internal:

- Added .editorconfig file http://editorconfig.org



0.13.1 - 22 March 2015
======

Internal:

- Provide README info regarding API STABLE status and upcoming v1.0 RC



0.13.0 - 22 March 2015
======

MAJOR BREAKING CHANGES
The big API rewrite for the newly named `Skematic` library. Tread softly.

Added:

- `.format()` major API method
- `sparse` capability flag to only process provided data
- Benchmark scripts in `/perf`
- `.npmignore` file to package `/build` and `/docs`

Removed:

- `validSchema` schema
- Checking schema is validate on data validation
- `.cast()` method
- EVERY method from API except "format", "validate", "createFrom" and setups

Changed:

- Major API calls now use `(schema, [opts,] data)` arguments
- Rename config field `filter` to `transforms`
- Return `null` on no errors on validate
- Rename `loadLib()` to `useGenerators()`
- Replace `accessor(fn)` with `useSchemas()` method

Internal:

- Massive refactor and restructure with lots of cleanup



0.12.0 - 19 March 2015
======

Placeholder release. Use v0.13.0



0.11.1 - 19 March 2015
======

MOVE NOTICE: `mekanika-schema` is now `skematic`
https://github.com/mekanika/skematic



0.11.0 - 18 March 2015
======

Added:

- .sparseValidate() to only validate provided data keys (not full schema)
- .has() and .hasNot() to rules

Changed:

- Skip filtering on `undefined` values
- Ignore type checking `undefined` values
- Prevent rule checks on unrequired `undefined` values
- Error on schema validation failure
- Validate skips `undefined` arrays that have a schema and default

Fixed:

- .default() not setting undefined values
- 'toNumber' filter converts empty string to `undefined`



0.10.1 - 30 December 2014
======

Changed:

- Updated README docs

Fixed:

- Handle 'falsey' default values



0.10.0 - 9 December 2014
=====

Changed:

- License to MPLv2

Internal:

- Updated case for boilerplate files



0.9.0 - 26 November 2014
=====

Added:

- Export the `toType()` general helper method
- `.createFrom()` instantiates a new defaulted object based on schema
- Computed values moved into repo `.computeAll()` and `.computeValue()`
- computeValue resolves function parameters

Changed:

- `.default()` now applies values to objects (not just scalars)
- `.test()` no longer defaults and casts, it ONLY tests data
- Update cast to work with arrays of scalars
- Validate does NOT filter/default. test->checkValue
- Validate can test scalars directly
- Clarify error message on cast to<Type>



0.8.0 - 20 October 2014
=====

Reducing this library to a pure data structure engine by pulling out wrappers, loaders and extraneous classes.

Added:

- 'nowhite' filter to remove whitespace

Removed:

- Model class
- 'Core' index accessor
- toJSON utility
- "load" class



0.7.0 - 13 August 2014
=====

Massive **breaking** change to how this library works. Designed to simplify the declaration and validation of data models, and make schema feel much more lightweight and declarative. Essentially a rework and re-subsuming of 'mekanika-property'.

The 'Schema' Class is now called "Model", and while greatly simplified, is otherwise much the same, made up of properties and methods, with some extra data useful for querying backend data sources (idAttribute, resource, adapter). The accessor wrapper for the Model class exposes the Model class and the schema library and is otherwise unchanged.

Added:

- Filters: modifiers that transform values (including **casting**)
  - exports.filter.available : array of filters
  - exports.filter.add(key, fn) : adds a filter for schema to use
  - Available:
    - All 'to$CAST' methods as filters
    - trim, uppercase, lowercase

- Rules:
  - `in` whitelister
  - `notIn` blacklister
  - `empty` with 'allowEmpty' parameter
  - `isAlpha` alpha characters
  - `isAlphaNum` alphaNumeric characters

- `exports.validSchema`: a a valid schema description (used for self-validation)

- **New schema API** - passes schema to all calls rather than creating instances
  - `.default(val, s)` returns value or default if unset
  - `.filter(val, s)` applies `s.filters` to value (throws on fail)
    - `.filter.add(key,fn)` adds filters for use
    - `.filter.available()` lists filter keys currently available
  - `.cast(val, s)` deep casts value (ie. objects & arrays)
  - `.test(val, s)` returns array of filter/rules errors
  - `.validate(val, s)` return `{$castData, $validBool, $errorObj}`


Removed:

- `Schema#new()`: no further attempts to load OOB information
- `Schema#normaliseType()`: no longer used, handled differently in schema
- `AuxArray`: have become 'Collections' in a separate repo


Changed:

- Change the way rules are provided:
  - Declared as `{rules:{ $key:$params, ... } }
  - `$key` is one of the loaded validators
  - `$params` are passed to validator
    - can be a value, or array of values, both work

- Failure messages are declared as named `{errors:{$rule:$msg,..}}`

- Rules:
  - Renamed "validators" to "rules"
  - **breaking:** renamed `is` and `regex` to -> `match`
  - **breaking:** renamed `not` and `notRegex` to -> `notMatch`
  - **breaking:** removed `between`
  - **breaking:** removed `betweenLength`

- Options:
  - `.__opt` renamed `.config`
  - getter/setter `.options()` removed. Directly access `.config`

- Types:
  - Now act as a _check_ not a cast
  - Available: string, number, integer, object, array, boolean



0.6.1 - 14 July 2014
=====

Added:

- Schema now include default `.idAttribute = 'id';` property

Changed:

- Setting an existing property now overwrites that property (not silent return)



0.6.0 - 7 July 2014
=====

Added:

- Support for `all` middleware hook by passing _just_ a function (no named event)
- Enable passing schema `options` as object hash on init `schema.new(key, opts)`

Removed:

- [Breaking!] .toRecord conversion utility (relying on .new() delegate to Record)
- Removed `reservedKey` check and restructured `normaliseType`
- [Breaking!] Application of pre + post middleware to vanilla schema

Internal:

- Simplify exportToJSON



0.5.1 - 1 July 2014
=====

Fixed:

- Setting property type as $schemaKey reference

Removed:

- Unused .updateKey(key) method (prefer direct .key accessor)

Internal:

- Additional test coverage



0.5.0 - 1 July 2014
=====

Massive **breaking** update that splits out `schema` into its own contained library to focus on providing structure for data models (built on Mekanika [Property](https://github.com/mekanika/property)). Other functionality moved to their own libraries (ie. Records, Collections, etc).

Changed:

- [Breaking!] Accessor `schema(key)` only returns existing schema (ie. `find` not `findOrCreate`)
- [Breaking!] Identity renamed to `key`, 'key' renamed to `resource`

Added:

- [Breaking!] New schema instantiation through `.new(key)`

Removed:

- [Breaking!] All references to and instantiation of 'Record' Class
- [Breaking!] Query delegation for CRUD methods (and `query` lib references)

Internal:

- Testing framework switched over to ChaiJS



0.4.1 - 17 Jun 2014
=====

Internal:

- Updated to support mekanika-query version 0.2.0



0.4.0 - 8 Jun 2014
=====

Added:

- Expose built in validators via schema.validators
- Adding `.toJSON` convertor for models
- Add `schema.unload( id )` method to clear individual schema from cache

Fixed:

- Clean up loading of JSON string

Internal:

- Update to support mekanika-property version 0.2.0



0.3.0 - 21 Feb 2014
=====

Changed:

- Ensure .toObject() only serialises non-required props that HAVE data

Fixed:

- `required` validator now fails on `undefined`, `null` and `''` (empty string)

Internal:

- Removed 'blanket' coverage script from package.json
- Refactor schema .load() method to reduce complexity



0.2.0 - 13 Dec 2013
=====

Changed:

- [Breaking!] Properties based on Schema are declared as `{type:'SchemaName'}`
- [Breaking!] Array properties are now declared as `{array:true`} (no more type:Array)
- Property class extracted as [mekanika-property](https://github.com/mekanika/property)
- `record#toString()` now returns JSON serialised string of record data
- `record#inspect()` returns record.toObject() toSource() (if avail) or toString()

Added:

- `schema.has( id )` existence operator method
- Reserved names for schema (based on supported types, 'string', 'date', etc)

Fixed:

- `record#toObject()` now serialises sub-schema and arrays

Internal:

- Test coverage switched to use `istanbul`
- Minor Makefile update (coverage added to .PHONY)



0.1.0 - 10 December 2013
=====

- Initial release
