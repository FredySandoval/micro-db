import { Router } from 'express';
const router = Router();
import { isEmpty } from 'lodash-es';
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
import { nanoid } from 'nanoid';
import Ajv from 'ajv';
const ajv = new Ajv();

import ipRangeCheck from 'ip-range-check';
import { check_restrictions, query_keys_validation } from '../tools/utils.mjs';
const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_KEYS = ['collectionid', '_id', 'id'];
const WHICH_FILE = "i - ";

// updating main index.json
const index_file = join(__dirname, '..', 'collections_index', 'index.json');
const index_adapter = new JSONFile(index_file);
const index_db = new Low(index_adapter);

router.post('/', async (req, res) => {
    if (isEmpty(req.body)) return res.status(400).send({ error: 'Empty body' });
    const new_insert_document = req.body;
    
    if (typeof new_insert_document !== 'object')
    return res.status(400).send({ error: 'Invalid request body' });
    
    // query string validation 
    const [error1] = query_keys_validation(req, VALID_KEYS);
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 });
    
    // Load collection
    const collectionid = req.query.collectionid;
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);
    await db.read();
    await index_db.read();

    // If no file return 404
    if (db.data == null) {
        return res.status(404).send({ error: 'collection not found' });
    }
    // check websiterestrictions
    const [error2] = check_restrictions(WHICH_FILE, req, db);
    if (error2) return res.status(403).send({ error: error2 });

    // User schema validation
    if (db.data?.schema) {
        const valid = ajv.validate(db.data?.schema, new_insert_document);
        if (!valid) {
            return res.status(400).send({ error: ajv.errorsText(ajv.errors) });
        }
    }

    // if no id, generate one
    if (!(new_insert_document._id ||
        new_insert_document.id)) Object.assign(new_insert_document, { _id: nanoid(6) });

    db.data.documents.push(new_insert_document);

    // read index.json
    await db.write();

    for (let i = 0; i < index_db.data.length; i++) {
        if (index_db.data[i].collectionid === collectionid) {
            index_db.data[i].updatedat = new Date();
            index_db.data[i].numberofdocuments = db.data.documents.length;
            break;
        }
    };
    await index_db.write();
    res.status(200).json(new_insert_document);
});

export { router as insert }