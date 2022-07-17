import { Router } from 'express';
const router = Router();

import { findIndex } from "lodash-es";

import { JSONparse } from '../tools/utils.mjs';

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
// import { nanoid } from 'nanoid';
import Joi from 'joi';
import Ajv from 'ajv';
const ajv = new Ajv();

import ipRangeCheck from 'ip-range-check';
const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_KEYS = ['collectionid', 'document'];
const ERROR_MESSAGE = {
    "unknown_pattern": "please use this pattern /find?collectionid=<collectionid>",
    "not_valid": (incorrect, correct) => `${incorrect} is invalid, please use ${correct}`,
    "invalid": (invalid) => `${invalid} is invalid`
}
const SCHEMA_FOR_KEYS = Joi.array().items(Joi.valid(...VALID_KEYS).required());
router.patch('/', async (req, res) => {

    // schema_validation
    const keys = Object.keys(req.query);
    const { error } = SCHEMA_FOR_KEYS.validate(keys);
    if (error) {
        if (error.details[0].type == 'array.includesRequiredUnknowns') {
            return res.status(400).send({ error: ERROR_MESSAGE.unknown_pattern });
        }
        const incorrect = error?.details[0]?.context?.value;
        const message = ERROR_MESSAGE.not_valid(incorrect, VALID_KEYS);
        return res.status(400).send({ error: message });
    }
    // Load collection
    const collectionid = req.query.collectionid;
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);
    await db.read();

    // If no file return 404
    if (db.data == null) {
        return res.status(404).send({ error: 'collection not found' });
    }
    // check websiterestrictions
    const websiterestrictions = db.data?.websiterestrictions?.split(',');
    if (websiterestrictions) {
        const hostname = req.hostname;
        if (websiterestrictions.indexOf(hostname) == -1) {
            return res.status(403).send({ error: '1 you are not allowed to access this collection' });
        }
    }
    // check iprestrictions
    const iprestrictions = db.data?.iprestrictions?.split(',');
    if (iprestrictions) {
        const ip = req.ip;
        const checkip = iprestrictions.some(iprange => {
            if (ipRangeCheck(ip, iprange)) {
                return true;
            }
        })
        if (!checkip) {
            return res.status(403).json({ error: '2 you are not allowed to access this collection' });
        }
    }
    let query_document = req.query?.document || null;
    let [err, parsed_document] = JSONparse(query_document);
    if (err) return res.status(400).json({ error: err });

    const document = parsed_document || req.body;
    const _key = Object.keys(document).indexOf('_id') != -1 ? '_id' : null ||
        Object.keys(document).indexOf('id') != -1 ? 'id' : null;
    console.log('key', _key);
    const id = req.body?.id ||
        req.body?._id ||
        parsed_document?._id ||
        parsed_document?.id;
    if (!_key) {
        return res.status(400).send({ error: 'No id provided in document' });
    };
    const index = findIndex(db.data.documents, { [_key]: id });
    if (index == -1) {
        return res.status(404).send({ error: 'document not found' });
    }
    // check schema
    const schema = db.data.schema;
    const valid = ajv.validate(schema, document);
    if (!valid) {
        return res.status(400).send({ error: ajv.errorsText(ajv.errors) });
    }
    const removed = db.data.documents.splice(index, 1, document);
    // db.data.documents[index] = document;
    await db.write();
    return res.status(200).json({ removed, data: document });
});
export { router as update }