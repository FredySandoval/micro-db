import { Router } from 'express';
const router = Router();

import { findIndex, isEmpty } from "lodash-es";

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
import Ajv from 'ajv';
const ajv = new Ajv();

// import ipRangeCheck from 'ip-range-check';
import { check_restrictions, get_document_key_id, query_keys_validation } from '../tools/utils.mjs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_KEYS = ['collectionid', '_id', 'id'];
const WHICH_FILE = "u - "

router.patch('/', async (req, res) => {
    if (isEmpty(req.body)) return res.status(400).send({ error: 'Emtpy body' });
    const new_updated_document = req.body;
    if (typeof new_updated_document !== 'object')
        return res.status(400).send({ error: '1 Invalid request body' });

    // query string validation 
    const [error1] = query_keys_validation(req, VALID_KEYS);
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 });

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
    const [error2] = check_restrictions(WHICH_FILE, req, db);
    if (error2) return res.status(403).send({ error: error2 });
    const [_key, id] = get_document_key_id(req);

    if (db.data?.schema) {
        const temp_document_id = new_updated_document[_key];
        delete new_updated_document[_key];
        const valid = ajv.validate(db.data?.schema, new_updated_document);
        if (!valid) {
            return res.status(400).send({ error: ajv.errorsText(ajv.errors) });
        }
        new_updated_document[_key] = temp_document_id;
    }
    // const id = new_updated_document[_key];
    const index = findIndex(db.data.documents, { [_key]: id });
    if (index == -1) {
        return res.status(404).send({ error: 'document not found' });
    }
    const removed = db.data.documents.splice(index, 1, new_updated_document);
    await db.write();
    return res.status(200).json({ removed, data: new_updated_document });
});
export { router as update }