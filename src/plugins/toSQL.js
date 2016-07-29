
/**
  Conversion map for Skematic type `key`s to equivalent PGSQL
  @private
*/

export const pgSQL = {
  ARRAY: (t, opts) => typeToSQL(t.type, opts) + ' ARRAY',
  BOOLEAN: t => t.key,
  BYTEA: t => t.key,
  CHAR: t => 'CHAR' + (t.length ? `(${t.length})` : ''),
  DATE: t => 'TIMESTAMPTZ',
  DECIMAL: t => t.key,
  DOUBLE: t => t.key,
  ENUM: (t, opts) => opts.fieldName,
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

export const typeToSQL = (type, opts = {forceUnrecognised: false}) => {
  if (!type) return ''

  // Return immediately if no key set on data type
  if (!type.key) {
    if (opts.forceUnrecognised) return type
    throw new Error('Unrecognised type: ' + type)
  }

  if (pgSQL[type.key]) return pgSQL[type.key](type, opts)
  else {
    if (opts.forceUnrecognised) return type.key
    throw new Error('Unrecognised type: ' + type.key)
  }
}

/**
  Converts a JS array to a PG SQL compatible string
  @example
  arrayToPGString(['1', '2'])
  // -> '{"1", "2"}'

  @param {Array} arr The array to convert
  @return {String}
*/

export const arrayToPGString = arr => {
  return JSON.stringify(arr).replace(/\[/g, '{').replace(/\]/g, '}')
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
  str.push(typeToSQL(model.type, {
    forceUnrecognised: true,
    fieldName: name
  }))

  // Apply any defaults
  // Note that PG requires strings to use `'` single quotes and arrays to be
  // formatted as `{val1, val2}` rather than '[val1, val2]'
  if (model.default) {
    let def = model.default

    if (Array.isArray(model.default)) {
      def = arrayToPGString(model.default)
    } else if (typeof model.default === 'object') {
      def = JSON.stringify(model.default)
    }

    // Ensure all string values of `def` are single quoted
    if (typeof def === 'string') def = `'${def}'`

    str.push(`DEFAULT ${def}`)
  }

  // Specify Primary key attribute
  if (model.primaryKey) str.push('PRIMARY KEY')

  // Handle NOT NULL
  if (model.allowNull === false) str.push('NOT NULL')

  return str.join(' ')
}

/**
  Generates a `CREATE TYPE` enumerated string for all enum fields in `model`

  @param {Object} model The Skematic model with potential enum fields
  @return {String[]|null} Array of CREATE TYPE strings or null if none
*/

const getEnumTypeString = model => {
  let enums = []

  Object.keys(model).forEach(key => {
    const type = model[key].type
    if (type.key !== 'ENUM') return

    let ts = type.values.map(v => typeof v === 'string' ? `'${v}'` : v)
    enums.push(`CREATE TYPE ${key} AS ENUM (${ts.join(', ')});`)
  })

  return enums.length ? enums : null
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

    // Generate ENUM types if present
    const enums = getEnumTypeString(model)
    if (enums) str += '\n' + enums.join('\n')

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
