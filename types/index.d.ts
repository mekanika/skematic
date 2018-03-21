export = Skematic;
export as namespace Skematic;

declare namespace Skematic {
  interface FormatOptions {
    /**
     * defaults:
     * Set default values on 'empty' fields. Toggle to false to disable.
     * @type {Boolean}
     */
    defaults?: boolean;
    /**
     * scopes:
     * List of scopes that toggle .show model fields on format()
     * See: validate() for .write scopes)
     * @type {String|String[]}
     */
    scopes?: string | string[];
    /**
     * unscope:
     * Ignores 'show' of scopes (ie. shows all fields)
     * @type {Boolean}
     */
    unscope?: boolean;
    /**
     * strict:
     * Strips any fields not declared on model
     * @type {Boolean}
     */
    strict?: boolean;
    /**
     * sparse:
     * Only process fields on the provided data, rather than all
     * fields on the entire model
     * @type {Boolean}
     */
    sparse?: boolean;
    /**
     * generate:
     * Enable/disable generating new values - see Design:generate
     * @type {Boolean}
     */
    generate?: boolean;
    /**
     * once:
     * Run generator functions set to {once: true} - see Design:generate
     * @type {Boolean}
     */
    once?: boolean;
    /**
     * transform:
     * Toggle to false to cancel modifying values
     * @type {Boolean}
     */
    transform?: boolean;
    /**
     * unlock:
     * Unlocks 'lock'ed model fields (ie. no longer stripped,
     * allows for overwriting).
     * @type {Boolean}
     */
    unlock?: boolean;
    /**
     * strip
     * Remove fields with matching values from data
     * @type {any[]}
     */
    strip?: any[];
    /**
     * mapIdFrom:
     * Maps a primary key field from the field name provided
     * (requires a primaryKey field set on the model)
     * @type {String}
     */
    mapIdFrom?: string;
  }

  interface ValidateOptions {
    /**
     * scopes:
     * List of scopes that will be tested against .write model
     * fields for matches. Errors if scopes don't meet.
     * @type {String|String[]}
     */
    scopes?: string | string[];
    /**
     * unscope:
     * Ignores any .write scope requirements on the model
     * @type {Boolean}
     */
    unscope?: boolean;
    /**
     * strict:
     * Validates that all keys provided by data are defined on the model
     * as well as valid (prevents validating/accepting extraneous fields)
     * @type {Boolean}
     */
    strict?: boolean;
    /**
     * sparse:
     * Only process fields on the provided data, rather than all
     * fields on the entire model
     * @type {Boolean}
     */
    sparse?: boolean;
    /**
     * keyCheckOnly:
     * Overrides normal validation and ONLY checks user data keys are all
     * defined on model. Useful to ensure user is not sending bogus keys.
     * @type {Boolean}
     */
    keyCheckOnly?: boolean;
  }

  // This is the function signature for custom rule methods on .rules
  // TODO: Currently unusable as TS cannot mix declared props and index sigs
  // @see https://stackoverflow.com/questions/47592546/how-to-combine-declared-interface-properties-with-custom-index-signature
  type RuleMethod = (value?: any) => boolean;

  interface Rules {
    /**
     * Allow for custom rules - even though we can't specify its type as
     * RuleMethod due to the inability to mix Index Signatures
     */
    [custom: string]: any; // RuleMethod
    /** The lowest permitted number */
    min?: number;
    /** The highest permitted number */
    max?: number;
    /** The shortest string permitted */
    minLength?: number;
    /** The longest string permitted */
    maxLength?: number;
    /** Value must be strictly equal */
    eq?: any;
    /** Value must not equal */
    neq?: any;
    /** Value must be one of the values in the list of elements */
    oneOf?: any[];
    /** Value must NOT be in the list of elements */
    notOneOf?: any[];
    /** List of elements contains the value */
    has?: any;
    /** List of elements does NOT contain the value */
    hasNot?: any;
    /** no parameters: Is the string an email */
    isEmail?: boolean;
    /** no parameters: Is the string a URL */
    isUrl?: boolean;
    /** no parameters: Checks value is an ALPHA string (abcd...) */
    isAlpha?: boolean;
    /** no parameters: Checks value is AlphaNumeric (abc..012..9) */
    isAlphaNum?: boolean;
    /** no parameters: Checks value is a Number (NaN fails this test) */
    isNumber?: boolean;
    /** no parameters: Checks value is of type String */
    isString?: boolean;
    /** String must match regexp */
    match?: RegExp;
    /** String must NOT match regexp */
    notMatch?: RegExp;
    /** set to true to check the value is empty */
    isEmpty?: boolean;
    /** set to true to check the value is not empty */
    notEmpty?: boolean;
  }

  /**
   * Arbitrary function
   */
  type Fn = (v?: any) => any;

  /**
   * Skematic Generators return values pending certain options passed as params
   */
  interface Generator {
      /**
       * The ops array lists fn objects or functions
       * A fn object specifies `fn` and `args`:
       * -> {fn: myFunc, args: []}
       */
      ops: Array<{fn: Fn, args: any[]} | Fn> | Fn;
      /** preserves a provided value */
      preserve?: boolean;
      /** ONLY generate if provided a field on data */
      require?: boolean;
      /** Require passing {once:true} to format to compute value */
      once?: boolean;
  }

  interface Model {
    [key: string]: ModelProps;
  }

  interface ModelProps {
    /**
     * type:
     * Aesthetic reference ONLY - has no effect on Skematic
     * Note: this is intended to connect with the plugins/datatypes
     * for use with SQL exporting. #todo
     */
    type?: any;
    /**
     * default:
     * Value to apply if no value is set/passed
     * @type {any}
     */
    default?: any;
    /**
     * lock:
     * Disallows/strips value on format (unlock format opts to override)
     * @type {Boolean}
     */
    lock?: boolean;
    /**
     * transform:
     * Function to transform a value (not called if value is
     * @type {Function}
     */
    transform?: (value: any) => any;
    /**
     * generate:
     * Enables computing a value from functions
     * @type {Generator|Fn}
     */
    generate?: Generator | Fn;
    /**
     * show:
     * Scopes required to show field on format (hides if not met)
     * @type {String|String[]}
     */
    show?: string | string[];
    /**
     * write:
     * @type {String|String[]}
     * Scopes required to validate this field being set (fails validation if
     * scopes aren't matching)
     */
    write?: string | string[];
    /**
     * model
     * declare sub-model defining this value (see "Sub-model")
     * @type {Skematic.Model}
     */
    model?: Model;
    /**
     * rules:
     * Validation rules: `{rules: {min: 3, max: 11}}`
     * @type {Skematic.Rules}
     */
    rules?: Rules;
    /**
     * errors:
     * Error messages for rules
     * @type {Object|String}
     */
    errors?: object | string;
    /**
     * required:
     * Flag if property MUST be set and/or provided
     * @type {Boolean}
     */
    required?: boolean;
    /**
     * allowNull:
     * Accept null values (no other validation applied) or set to false to
     * force a NOT NULL condition (no undefined or null values permitted).
     * Designed to: a) false: enables setting required (which ordinarily
     * passes for null) while disallowing null as a value. b) true: enables
     * accepting null without triggering any other rule validation (ie. 'null'
     * becomes a valid value)
     * @type {Boolean}
     */
    allowNull?: boolean;
    /**
     * primaryKey:
     * flag to indicate whether this field is the primary key (id field),
     * used in conjunction with mapIdFrom format option to allow transposing
     * your datastore id to some other field on your data model (eg. Mongo's
     * _id can be mapped to the field you set primaryKey: true on)
     * @type {Boolean}
     */
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

  /**
   * Formats incoming `data` against a provided model
   * @param {Skematic.Model|Skematic.ModelProps} model
   * @param {any} data
   * @param {Skematic.FormatOptions} options
   */
  function format(
    model: Model | ModelProps,
    data?: any,
    options?: FormatOptions
  ): any;

  /**
   * Moo
   * @param {Skematic.Model|Skematic.ModelProps} model
   * @param {any} data
   * @param {Skematic.ValidateOptions} options
   */
  function validate(
    model: Model,
    data: any,
    options?: ValidateOptions
  ): ValidateComplexReturn;

  /**
   * Hello
   * @param {Skematic.ModelProps} model
   * @param data
   * @param options
   */
  function validate(
    model: ModelProps,
    data: any,
    options?: ValidateOptions
  ): ValidateSimpleReturn;
}
