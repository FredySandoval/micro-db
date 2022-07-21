const Joi = require('joi');

const BASIC_COLLECTION = Joi.object({
    collectionid: Joi.string().required(),
    collectionname: Joi.string().valid('Untitled').required(),
    createdat: Joi.string().isoDate().required(),
    updatedat: Joi.string().isoDate().required(),
    documents: Joi.array().empty().required()
});

// password: Joi.string().pattern(/^[a-zA-Z0-9]{4,30}$/).optional(),
const FULL_COLLECTION = Joi.object({
    collectionid: Joi.string().required(),
    collectionname: Joi.string().min(3).max(30).required(),
    createdat: Joi.string().isoDate().required(),
    updatedat: Joi.string().isoDate().required(),
    email: Joi.string().email().optional(),
    password: Joi.string().pattern(/^[\*]{4,30}$/).required(),
    requirepasswordtodelete: Joi.boolean().required(),
    websiterestrictions: Joi.array().items(Joi.alternatives().try(Joi.string().valid("localhost"), Joi.string().domain())).required(),
    iprestrictions: Joi.array().items(Joi.string().ip({ version: ['ipv4', 'ipv6'], cidr: 'optional' })).required(),
    schema: Joi.object().required(),
    documents: Joi.array().empty().required()
});
module.exports = { BASIC_COLLECTION, FULL_COLLECTION };
