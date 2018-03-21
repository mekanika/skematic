
/*
  Common error message

  @param {Object} el Vasds
  @private
  @ignore
*/

const errMsg = (el, field) => {
  return `${el.key} ${field} requires one of: ${el.valid[field].join(', ')}`
}

/**
  Type: STRING
  Postgres: VARCHAR
  @param {Number} [len] Optional max length of the string
  @return {Object} {key, length}
  @memberof DataTypes
*/

function STRING (len) {
  if (!(this instanceof STRING)) return new STRING(len)
  if (len) this.length = len
}

STRING.key = STRING.prototype.key = 'STRING'

const CHAR_LENGTH = 8

/**
  Type: CHAR
  Postgres: CHAR
  @param {Number} len
  @return {Object} {key, length}
  @memberof DataTypes
*/

function CHAR (len = CHAR_LENGTH) {
  if (!(this instanceof CHAR)) return new CHAR(len)
  if (len) this.length = len
}

CHAR.key = CHAR.prototype.key = 'CHAR'
Object.defineProperty(CHAR, 'length', {
  get () { return CHAR_LENGTH }
})

/**
  Type: TEXT
  Converts to: TEXT
  @param {String} [type] 'tiny', 'medium', or 'long'

  @return {Object} {key, type}
  @memberof DataTypes
*/

function TEXT (type) {
  if (!(this instanceof TEXT)) return new TEXT(type)

  this.valid = {type: ['tiny', 'medium', 'long']}
  if (type) {
    if (this.valid.type.indexOf(type) < 0) {
      throw new Error(errMsg(this, 'type'))
    }
    this.type = type
  }
}

TEXT.key = TEXT.prototype.key = 'TEXT'

/**
  Type: BYTEA
  Converts to: BYTEA
  @return {Object} {key}
  @memberof DataTypes
*/

function BYTEA () {
  if (!(this instanceof BYTEA)) return new BYTEA()
}

BYTEA.key = BYTEA.prototype.key = 'BYTEA'

/**
  Type: NUMBER
  Postgres: NUMERIC

  @param {Number} [precision]
  @param {Number} [scale]
  @return {Object} {key, precision, scale}
  @memberof DataTypes
*/

function NUMBER (precision, scale) {
  if (!(this instanceof NUMBER)) return new NUMBER(precision, scale)

  if (precision) this.precision = precision
  if (scale) this.scale = scale
}

NUMBER.key = NUMBER.prototype.key = 'NUMBER'

/**
  Type: INTEGER
  Converts to: INTEGER, SMALLINT, BIGINT
  @param {String} [size] One of `small` or `big`
  @return {Object} {key, size}
  @memberof DataTypes
*/

function INTEGER (size) {
  if (!(this instanceof INTEGER)) return new INTEGER(size)

  this.valid = {size: ['small', 'big']}
  if (size) {
    if (!this.valid.size.indexOf(size) < 0) {
      throw new Error(errMsg(this, 'size'))
    }
  }
}

INTEGER.key = INTEGER.prototype.key = 'INTEGER'

/**
  Type: DECIMAL
  @return {Object} {key}
  @memberof DataTypes
*/

function DECIMAL () {
  if (!(this instanceof DECIMAL)) return new DECIMAL()
}

DECIMAL.key = DECIMAL.prototype.key = 'DECIMAL'

/**
  Type: DOUBLE
  @return {Object} {key}
  @memberof DataTypes
*/

function DOUBLE () {
  if (!(this instanceof DOUBLE)) return new DOUBLE()
}

DOUBLE.key = DOUBLE.prototype.key = 'DOUBLE'

/**
  Type: REAL
  @return {Object} {key}
  @memberof DataTypes
*/

function REAL () {
  if (!(this instanceof REAL)) return new REAL()
}

REAL.key = REAL.prototype.key = 'REAL'

/**
  Type: FLOAT
  @return {Object} {key}
  @memberof DataTypes
*/

function FLOAT () {
  if (!(this instanceof FLOAT)) return new FLOAT()
}

FLOAT.key = FLOAT.prototype.key = 'FLOAT'

/**
  Type: TIME
  @param {Number} [precision]
  @return {Object} {key}
  @memberof DataTypes
*/

function TIME (precision) {
  if (!(this instanceof TIME)) return new TIME(precision)
}

TIME.key = TIME.prototype.key = 'TIME'

/**
  Type: DATE
  Postgres: TIMESTAMPTZ
  @return {Object} {key}
  @memberof DataTypes
*/

function DATE () {
  if (!(this instanceof DATE)) return new DATE()
}

DATE.key = DATE.prototype.key = 'DATE'

/**
  Type: BOOLEAN
  @return {Object} {key}
  @memberof DataTypes
*/

function BOOLEAN () {
  if (!(this instanceof BOOLEAN)) return new BOOLEAN()
}

BOOLEAN.key = BOOLEAN.prototype.key = 'BOOLEAN'

/**
  Type: UUID
  @return {Object} {key}
  @memberof DataTypes
*/

function UUID () {
  if (!(this instanceof UUID)) return new UUID()
}

UUID.key = UUID.prototype.key = 'UUID'

/**
  Type: JSONTYPE
  Postgres: JSON
  @return {Object} {key}
  @memberof DataTypes
*/

function JSONTYPE () {
  if (!(this instanceof JSONTYPE)) return new JSONTYPE()
}

JSONTYPE.key = JSONTYPE.prototype.key = 'JSON'

/**
  Type: JSONB
  @return {Object} {key}
  @memberof DataTypes
*/

function JSONB () {
  if (!(this instanceof JSONB)) return new JSONB()
}

JSONB.key = JSONB.prototype.key = 'JSONB'

/**
  Type: HSTORE
  @return {Object} {key}
  @memberof DataTypes
*/

function HSTORE () {
  if (!(this instanceof HSTORE)) return new HSTORE()
}

HSTORE.key = HSTORE.prototype.key = 'HSTORE'

/**
  Type: ARRAY
  @param {Object|String} ofType The type of elements in the array
  @return {Object} {key}
  @memberof DataTypes
*/

function ARRAY (ofType) {
  if (!(this instanceof ARRAY)) return new ARRAY(ofType)
  if (ofType) this.type = ofType
}

ARRAY.key = ARRAY.prototype.key = 'ARRAY'

/**
  Type: GEOMETRY
  @return {Object} {key}
  @memberof DataTypes
*/

function GEOMETRY () {
  if (!(this instanceof GEOMETRY)) return new GEOMETRY()
}

GEOMETRY.key = GEOMETRY.prototype.key = 'GEOMETRY'

/**
  Type: GEOGRAPHY
  @return {Object} {key}
  @memberof DataTypes
*/

function GEOGRAPHY () {
  if (!(this instanceof GEOGRAPHY)) return new GEOGRAPHY()
}

GEOGRAPHY.key = GEOGRAPHY.prototype.key = 'GEOGRAPHY'

/**
  Type: ENUM
  @param {Array} arrValues
  @return {Object} {key, values}
  @memberof DataTypes
*/

function ENUM (arrValues) {
  if (!(this instanceof ENUM)) return new ENUM(arrValues)
  if (!arrValues) throw new Error('ENUM must declare array of values')
  this.values = arrValues
}

ENUM.key = ENUM.prototype.key = 'ENUM'

/**
  Type: RANGE
  @param {Object} type The type of Range
  @return {Object} {key, type}
  @memberof DataTypes
*/

function RANGE (type) {
  if (!(this instanceof RANGE)) return new RANGE(type)
  if (!type) throw new Error('RANGE must declare type')
  this.type = type
}

RANGE.key = RANGE.prototype.key = 'RANGE'

/**
  Type: SERIAL
  @return {Object} {key}
  @memberof DataTypes
*/

function SERIAL () {
  if (!(this instanceof SERIAL)) return new SERIAL()
}

SERIAL.key = SERIAL.prototype.key = 'SERIAL'

/**
  @namespace DataTypes

  @description
  Simplified type system that provides a bridge from simple strings (that
  don't get type-checked/validated) and Skematic DataTypes (that do)

  Based on [Sequelize DataTypes](https://github.com/sequelize/sequelize/blob/master/lib/data-types.js)

  These declarations prepare "type objects" that are defined by a `key`:

  `{key: 'INTEGER'}`

  These type objects can have various properties, including:

  - length
  - size
  - type

  This allows creating a type definition with modifiers. Type objects are
  designed to enable _mapping_ to an output DB declaration. Using an example
  for Postgres:

  `{key: 'INTEGER', size: 'small'}`
  `-> SMALLINT`

*/

module.exports = {
  ARRAY,
  BOOLEAN,
  BYTEA,
  CHAR,
  DATE,
  DECIMAL,
  DOUBLE,
  ENUM,
  FLOAT,
  GEOGRAPHY,
  GEOMETRY,
  HSTORE,
  INTEGER,
  JSON: JSONTYPE,
  JSONB,
  NUMBER,
  RANGE,
  REAL,
  SERIAL,
  STRING,
  TEXT,
  TIME,
  UUID
}
