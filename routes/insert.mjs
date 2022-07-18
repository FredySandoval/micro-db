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
const __dirname = dirname(fileURLToPath(import.meta.url));

router.post('/', async (req, res) => {
    if (isEmpty(req.body)) return res.status(400).send({ error: 'Empty body' });
    const new_insert_document = req.body;

    if (typeof new_insert_document !== 'object')
        return res.status(400).send({ error: 'Invalid request body' });

    // query string validation 
    const keys = Object.keys(req.query);
    if (keys.length === 0) return res.status(400).send({ error: 'No collectionid provided' });
    if (keys.length > 1) return res.status(400).send({ error: "Usage example: /insert?collectionid=XYz..." });
    if (keys[0] !== 'collectionid') return res.status(400).send({ error: "Usage example: /insert?collectionid=XYz..." });

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
    if (db.data?.websiterestrictions) {
        const hostname = req.hostname;
        if (db.data?.websiterestrictions.indexOf(hostname) == -1) {
            return res.status(403).send({ error: '1 you are not allowed to access this collection' });
        }
    }
    // check iprestrictions
    if (db.data?.iprestrictions) {
        const ip = req.ip;
        const checkip = db.data?.iprestrictions.some(iprange => {
            if (ipRangeCheck(ip, iprange)) {
                return true;
            }
        })
        if (!checkip) {
            return res.status(403).json({ error: '2 you are not allowed to access this collection' });
        }
    }

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
    await db.write();

    // updating main index.json
    const index_file = join(__dirname, '..', 'collections_index', 'index.json');
    const index_adapter = new JSONFile(index_file);
    const index_db = new Low(index_adapter);
    await index_db.read();
    for (let i = 0; i < index_db.data.length; i++) {
        if (index_db.data[i].collectionid === collectionid) {
            index_db.data[i].updatedat = new Date();
            index_db.data[i].numberofdocuments = db.data.documents.length;
            break;
        }
    };
    await index_db.write();

    res.status(200).json({ data: new_insert_document });
});

export { router as insert }