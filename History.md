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