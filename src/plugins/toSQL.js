
/**
  Conversion map for Skematic type `key`s to equivalent PGSQL
  @private
*/

export const pgSQL = {
  ARRAY: t => typeToSQL(t.type) + ' ARRAY',
  BOOLEAN: t => t.key,
  BYTEA: t => t.key,
  CHAR: t => 'CHAR' + (t.length ? `(${t.length})` : ''),
  DATE: t => 'TIMESTAMPTZ',
  DECIMAL: t => t.key,
  DOUBLE: t => t.key,
  ENUM: t => t.key,
  FLOAT: t => t.key,
  GEOGRAPHY: t => t.key,
  GEOMETRY: t => t.key,
  HSTORE: t => t.key,
  INTEGER: t => t.size ? t.size.toUpperCase() + 'INT' : 'INTEGER',
  JSON: t => t.key,
  JSONB: t => t.key,
  NUMBER: t => {
    let sql = 'NUMERIC'
    // For scale to apply, precision MUST be defined
    if (t.precision) {
      let def = [t.precision]
      if (t.scale) def.push(t.scale)
      sql += `(${def.join(', ')})`
    }
    return sql
  },
  RANGE: t => t.key,
  REAL: t => t.key,
  SERIAL: t => t.key,
  STRING: t => 'VARCHAR' + (t.length ? `(${t.length})` : ''),
  TEXT: t => t.key,
  TIME: t => 'TIMESTAMPTZ',
  UUID: t => t.key
}

/**
  Converts a DataType to a SQL compliant string

  @param {Object|String} type The type to convert to SQL string
  @param {Boolean} [forceUnrecognised] Don't throw on unrecognised type

  @throws On unrecognised type
  @return {String} The SQL compliant string
*/

export const typeToSQL = (type, forceUnrecognised = false) => {
  if (!type) return ''

  // Return immediately if no key set on data type
  if (!type.key) {
    if (forceUnrecognised) return type
    throw new Error('Unrecognised type: ' + type)
  }

  if (pgSQL[type.key]) return pgSQL[type.key](type)
  else {
    if (forceUnrecognised) return type.key
    throw new Error('Unrecognised type: ' + type.key)
  }
}

/**
  Converts a field column on a model to a SQL string

  @param {String} name The name of column
  @param {Object} model The associated Skematic model for this column
  @param {String} table The name of the table (used for debug)

  @return {String} The SQL for this column
*/

export const fieldToString = (name, model, table) => {
  // Define the colun name
  let str = [name]

  if (!model.type) {
    console.warn(`[Skematic] Can't create SQL for column '${table + '.' + name}' with no type`)
  }

  // Specify the column type
  str.push(typeToSQL(model.type, true))

  // Apply any defaults
  if (model.default) str.push('DEFAULT ' + JSON.stringify(model.default))

  // Specify Primary key attribute
  if (model.primaryKey) str.push('PRIMARY KEY')

  // Handle NOT NULL
  if (model.allowNull === false) str.push('NOT NULL')

  return str.join(' ')
}

/**
  Converts a keyed object of Skematic models to equivalent CREATE SQL

  @example
  const model = {id: {primaryKey: true}, name: {type: Skematic.STRING}}}
  toSQL({tablefoo: model})
  // CREATE TABLE tablefoo (
  //   id PRIMARY KEY,
  //   name VARCHAR
  // );

  @param {Object} schema The 'table' keyed list of models to write as SQL

  @return {String} The SQL CREATE strings
*/

export default function toSQL (schema, opts = {}) {
  let sql = `-- Skematic generated SQL\n-- ${(new Date().toISOString())}\n\n`

  Object.keys(schema).forEach(k => {
    const model = schema[k]

    if (!Object.keys(model).length) return (sql += '-- No keys for model:' + k)

    // Open the field string
    let str = ''

    if (true) { // opts.dropTables)
      str += `\nDROP TABLE IF EXISTS ${k};`
    }

    str += `\nCREATE TABLE ${k} (\n`
    let fields = Object.keys(model).map(field =>
      // Adds cosmetic spacing to column definitions
      '  ' + fieldToString(field, model[field], k)
    )
    str += fields.join(',\n')
    str += `\n);\n`

    sql += str
  })

  sql += '\n-- (end)'

  return sql
}
