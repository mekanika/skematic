export = Skematic;
export as namespace Skematic;

declare namespace Skematic {
  interface FormatOptions {
    // defaults
    // {Boolean} - true
    // Set default values on 'empty' fields. Toggle to false to disable.
    defaults?: boolean;
    // scopes
    // {String|Array} - undefined
    // List of scopes that toggle .show model fields on format()
    // (See validate() for .write scopes)
    scopes?: string | string[];
    // unscope
    // {Boolean} - false
    // Ignores 'show' of scopes (ie. shows all fields)
    unscope?: boolean;
    // strict
    // {Boolean} - false
    // Strips any fields not declared on model
    strict?: boolean;
    // sparse
    // {Boolean} - false
    // Only process fields on the provided data, rather than all
    // fields on the entire model
    sparse?: boolean;
    // generate
    // {Boolean} - true
    // Enable/disable generating new values - see Design:generate
    generate?: boolean;
    // once
    // {Boolean} - false
    // Run generator functions set to {once: true} - see Design:generate
    once?: boolean;
    // transform
    // {Boolean} - true
    // Toggle to false to cancel modifying values
    transform?: boolean;
    // unlock
    // {Boolean} - false
    // Unlocks 'lock'ed model fields (ie. no longer stripped,
    // allows for overwriting).
    unlock?: boolean;
    // strip
    // {Array} - []
    // Remove fields with matching values from data
    strip?: any[];
    // mapIdFrom
    // {String} - undefined
    // Maps a primary key field from the field name provided
    // (requires a primaryKey field set on the model)
    mapIdFrom?: string;
  }

  interface ValidateOptions {
    // scopes
    // {String|Array} - undefined
    // List of scopes that will be tested against .write model
    // fields for matches. Errors if scopes don't meet.
    scopes?: string | string[];
    // unscope
    // {Boolean} - false
    // Ignores any .write scope requirements on the model
    unscope?: boolean;
    // strict
    // {Boolean} - false
    // Validates that all keys provided by data are defined on the model
    // as well as valid (prevents validating/accepting extraneous fields)
    strict?: boolean;
    // sparse
    // {Boolean} - false
    // Only process fields on the provided data, rather than all
    // fields on the entire model
    sparse?: boolean;
    // keyCheckOnly
    // {Boolean} - false
    // Overrides normal validation and ONLY checks user data keys are all
    // defined on model. Useful to ensure user is not sending bogus keys.
    keyCheckOnly?: boolean;
  }

  // This is the function signature for custom rule methods on .rules
  // TODO: Currently unusable as TS cannot mix declared props and index sigs
  // @see https://stackoverflow.com/questions/47592546/how-to-combine-declared-interface-properties-with-custom-index-signature
  type RuleMethod = (value?: any) => boolean;

  interface Rules {
    // Allow for custom rules - even though we can't specify its type as
    // RuleMethod due to the inability to mix Index Signatures
    [custom: string]: any; // RuleMethod
    // The lowest permitted number
    min?: number;
    // The highest permitted number
    max?: number;
    // The shortest string permitted
    minLength?: number;
    // The longest string permitted
    maxLength?: number;
    // Value must be strictly equal
    eq?: any;
    // Value must not equal
    neq?: any;
    // Value must be one of the values in the list of elements
    oneOf?: any[];
    // Value must NOT be in the list of elements
    notOneOf?: any[];
    // List of elements contains the value
    has?: any;
    // List of elements does NOT contain the value
    hasNot?: any;
    // no parameters: Is the string an email
    isEmail?: true;
    // no parameters: Is the string a URL
    isUrl?: true;
    // no parameters: Checks value is an ALPHA string (abcd...)
    isAlpha?: true;
    // no parameters: Checks value is AlphaNumeric (abc..012..9)
    isAlphaNum?: true;
    // no parameters: Checks value is a Number (NaN fails this test)
    isNumber?: true;
    // no parameters: Checks value is of type String
    isString?: true;
    // String must match regexp
    match?: RegExp;
    // String must NOT match regexp
    notMatch?: RegExp;
    // set to true to check the value is empty
    isEmpty?: true;
    // set to true to check the value is not empty
    notEmpty?: true;
  }

  // Arbitrary function
  type Fn = (v?: any) => any;

  interface Generator {
      // The ops array lists fn objects or functions
      // A fn object specifies `fn` and `args`:
      // -> {fn: myFunc, args: []}
      ops: Array<{fn: Fn, args: any[]} | Fn>;
      // preserves a provided value
      preserve?: boolean;
      // ONLY generate if provided a field on data
      require?: boolean;
      // Require passing {once:true} to format to compute value
      once?: boolean;
  }

  interface Model {
    [key: string]: ModelProps;
  }

  interface ModelProps {
    // default {any}
    // value to apply if no value is set/passed
    default?: any;
    // lock {Boolean}
    // disallows/strips value on format (unlock format opts to override)
    lock?: boolean;
    // transform {Function}
    // a function to transform a value (not called if value is
    // undefined or null)
    transform?: (value: any) => any;
    // generate {Object|Function}
    // enables computing a value from functions
    generate?: Generator | Fn;
    // show {String|Array}
    // string scopes required to show field on format (hides if not met)
    show?: string | string[];
    // write {String|Array}
    // scopes required to validate this field being set (fails validation if
    // scopes aren't matching)
    write?: string | string[];
    // model {Object}
    // declare sub-model defining this value (see "Sub-model")
    model?: Model;
    // rules {Object}
    // validation rules: {rules: {min: 3, max: 11}}
    rules?: Rules;
    // errors {Object|String}
    // error messages for rules
    errors?: object | string;
    // required {Boolean}
    // flag if property MUST be set and/or provided
    required?: boolean;
    // allowNull {Boolean}
    // Accept null values (no other validation applied) or set to false to
    // force a NOT NULL condition (no undefined or null values permitted).
    // Designed to: a) false: enables setting required (which ordinarily
    // passes for null) while disallowing null as a value. b) true: enables
    // accepting null without triggering any other rule validation (ie. 'null'
    // becomes a valid value)
    allowNull?: boolean;
    // primaryKey {Boolean}
    // flag to indicate whether this field is the primary key (id field),
    // used in conjunction with mapIdFrom format option to allow transposing
    // your datastore id to some other field on your data model (eg. Mongo's
    // _id can be mapped to the field you set primaryKey: true on)
    primaryKey?: boolean;
  }

  interface ValidateComplexReturn {
    valid: boolean;
    errors: {[key: string]: string[]} | null;
  }

  interface ValidateSimpleReturn {
    valid: boolean;
    errors: string[] | null;
  }

  function format(
    model: Model | ModelProps,
    data?: any,
    options?: FormatOptions
  ): any;

  function validate(
    model: Model,
    data: any,
    options?: ValidateOptions
  ): ValidateComplexReturn;

  function validate(
    model: ModelProps,
    data: any,
    options?: ValidateOptions
  ): ValidateSimpleReturn;
}
