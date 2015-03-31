
/**
  Expose the module
  @ignore
*/

module.exports = idMap;


/**
  Defines the property to lookup
  @ignore
*/

var KEY_NAME = 'primaryKey';


/**
  Internal helper to retrieve an arbitrary property match from an object hash

  @param {Schema} schema
  @param {String} name The name of the property to match

  @return {String|undefined} The name of the first field matching the property
  @private
*/

var _getField = function (schema, name) {

  for (var key in schema) {
    if (!schema.hasOwnProperty(key)) continue;
    if (schema[key][name]) return key;
  }

};


/**
  Maps a default id field to a schema provided primaryKey field

  ```js
  var propSchema = {
    prop_id: {primaryKey:true},
    name: {type:"string"}
  };

  // Example default results from data store:
  var data = [ {_id:"512314", name:"power"}, {_id:"519910", name:"speed"} ];

  xo( propSchema, data, '_id' );
  // -> [ {prop_id:"512314", name:"power"}, {prop_id:"519910", name:"speed"} ]
  ```

  @param {Schema} schema The model to apply
  @param {Array} col The collection array of data objects to map
  @param {String} idField The name of the provided id field

  @return {Array} The collection of data mapped id fields
  @memberOf Format
*/

function idMap (schema, col, idField) {

  // Load up the primaryKey field from a given model
  var pk = _getField(schema, KEY_NAME );

  // No need to replace anything if no primary key
  if (!pk) return col;
  // No need to replace anything if primary key field auto-generated
  if (schema[pk].generate) return col;


  // Step through collection and rename primary key field
  for (var i = 0; i < col.length; i++) {
    var el = col[i];

    el[pk] = el[idField];
    delete el[idField];
  }

  return col;
}
