import Joi from 'joi';
import Ajv from 'ajv';
const ajv = new Ajv();
/**
 * @example
 * new collection example:
 * const data = {
 *     collectionid: "fNnA_Lr7rpvS9MDzV8IoA",
 *     createdat: "2022-07-17T03:06:59.134Z",
 *     updatedat: "2022-07-17T03:06:59.134Z",
 *     collectionname: "test",
 *     email: "mfigeroa@gmail.com",
 *     password: "randompass1",
 *     requirepasswordtodelete: "false",
 *     schema: {
 *         type: "object",
 *         properties: {
 *             foo: { type: "array", items: { type: "string" }, maxItems: 3 },
 *             bar: { type: "string", maxLength: 3, minLength: 1 },
 *             fooo: { type: "number", minimum: 1, maximum: 10 },
 *             bax: { type: "boolean" },
 *             baz: { type: "object", minPrroperties: 1, maxProperties: 3, required: ["foo", "bar"] },
 *         },
 *         required: ["foo", "bar", "fooo"],
 *         additionalProperties: false,
 *     },
 *     websiterestrictions: ["google.com"],
 *     iprestrictions: ["127.0.0.1/22"],
 *     documents: []
 * }
 */
/**
 * @constant
 * @type {object} - Joi Object
 * @default
 */
const SCHEMA_FOR_NEW_COLLECTION = Joi.object({
    collectionid: Joi.string().required(),
    collectionname: Joi.string().min(3).max(30).required(),
    createdat: Joi.string().isoDate().required(),
    updatedat: Joi.string().isoDate().required(),
    email: Joi.string().email().optional(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{4,30}$/).optional(),
    requirepasswordtodelete: Joi.boolean().optional(),
    websiterestrictions: Joi.array().items(Joi.alternatives().try( Joi.string().valid("localhost"), Joi.string().domain())).optional(),
    iprestrictions: Joi.array().items(Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'optional' })).optional(),
    schema: Joi.object().optional(),
    documents: Joi.array().empty().required()
}).with('schema', 'password').with('email', 'password').with('requirepasswordtodelete', 'password');

/**
 * @constant
 * @type {object} - Joi Object
 * @default
 */
const SCHEMA_FOR_USER_PROVIDED_SCHEMA = Joi.object({
    type: Joi.string().valid('object').required(),
    properties: Joi.object().min(1).max(20).required(),
    required: Joi.array().items(Joi.string()).max(20).required(),
    additionalProperties: Joi.boolean().required()
});

/**
 * @constant
 * @type {array} - valid primites for Joi scheme
 * @default
 */
const valid_primitives = ['array', 'string', 'number', 'boolean', 'object'];

/**
 * @constant
 * @type {object} - Joi Object
 * @default
 */
const SCHEMA_FOR_SCHEMA_PROPERTIES = Joi.object({
    type: Joi.string().valid(...valid_primitives).required(),
    items: Joi.object({ type: Joi.string().valid(...valid_primitives) }).optional(),
    maxItems: Joi.number().integer().optional(),
    maxLength: Joi.number().integer().optional(),
    minLength: Joi.number().integer().optional(),
    minimum: Joi.number().integer().optional(),
    maximum: Joi.number().integer().optional(),
    minProperties: Joi.number().integer().optional(),
    maxProperties: Joi.number().integer().optional(),
    required: Joi.array().items(Joi.string()).max(40).optional(),
})
/** 
 * @example
 * const [schema_error] = validate_new_collection(data);
 * if (schema_error) {
 *     console.log(schema_error);
 * }
 * if (data.schema) {
 *     const ajv_data = {
 *         foo: ["hello", "world", "foo"],
 *         bar: "hel",
 *         fooo: 4,
 *         baz: { foo: "hello", bar: "world", bax: "how" },
 *     }
 *     const ajv_validate = ajv.validate(data.schema, ajv_data);
 *     console.log('ajv_validate', ajv_validate);
 *     if (!ajv_validate) console.log(ajv.errors);
 * }
 * @param {Object} data - The data to validate
 * @returns - [ error ] - if ( error ) return
 */
function validate_new_collection(data) {
    // Validates the New Collection 
    const schema_0 = SCHEMA_FOR_NEW_COLLECTION.validate(data);
    if (schema_0.error) return [schema_0.error]
    if (data.schema) {
        // If user provided a schmema, its validated
        const schema_1 = SCHEMA_FOR_USER_PROVIDED_SCHEMA.validate(data.schema);
        if (schema_1.error) return [schema_1.error]
        // Validates the properties of the schema
        let error_2 = null;
        if (data.schema?.properties) {
            Object.values(data.schema.properties).forEach(property => {
                const schema_2 = SCHEMA_FOR_SCHEMA_PROPERTIES.validate(property);
                // This if is to exit, otherwise error is not returned
                if (schema_2.error) { error_2 = schema_2.error; return }
            });
            if (error_2) return [error_2]
        }
    }
    return [null];
}
export { validate_new_collection };