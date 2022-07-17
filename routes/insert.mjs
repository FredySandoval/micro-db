import { Router } from 'express';
const router = Router();
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
import { nanoid } from 'nanoid';
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

router.post('/', async (req, res) => {
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

    // insert to collection
    let document = req.query.document || req.body;
    if (!document) {
        return res.status(400).send({ error: 'No document provided' });
    };
    if (typeof document == 'string') {
        try {
            document = JSON.parse(document);
        }
        catch (e) {
            console.log('e1', e);
            var temp = document.split(","), theobj = {};
            console.log('temp', temp);
            if (temp.length < 2 || temp.length % 2 != 0) {
                return res.status(400).send({ error0: ERROR_MESSAGE.invalid(document) });
            }
            for (let i = 0; i < temp.length; i += 2) {
                // little check if number of boolean
                temp[(i + 1)] = /^\d+$/.test(temp[(i + 1)]) ? Number(temp[i + 1]) : temp[(i + 1)];
                temp[(i + 1)] = temp[(i + 1)] === "true" || temp[(i + 1)] === "false" ? Boolean(temp[(i + 1)]) : temp[(i + 1)];
                theobj[temp[i]] = temp[(i + 1)];
            }
            document = theobj;
        }
    }
    // checks before insert
    if (Object.keys(document).length === 0) {
        return res.status(400).send({ error1: 'Document is emtpy, check your post request if unsure' });
    }
    let typeof_document = typeof document;
    if (!document ||
        typeof_document !== 'object' ||
        Array.isArray(document) ||
        typeof_document === 'function' ||
        typeof_document === 'symbol' ||
        typeof_document === 'boolean' ||
        typeof_document === 'number' ||
        typeof_document === 'string' ||
        typeof_document === 'undefined' ||
        typeof_document === 'null'
    ) {
        return res.status(400).send({ error2: ERROR_MESSAGE.invalid(document) });
    }
    if (db.data?.schema) {
        const valid = ajv.validate(db.data?.schema, document);
        if (!valid) {
            return res.status(400).send({ error: ajv.errorsText(ajv.errors) });
        }
    }

    // if no id, generate one
    if (!(document._id || document.id)) Object.assign(document, { _id: nanoid(6) });

    db.data.documents.push(document);
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

    res.status(200).json({data: document});
});

export { router as insert }