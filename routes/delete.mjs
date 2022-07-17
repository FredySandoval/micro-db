import { Router } from 'express';
const router = Router();

import Joi from 'joi';
import { unlinkSync } from 'fs';
import { remove, findIndex, isEmpty } from 'lodash-es'
import ipRangeCheck from 'ip-range-check';
import { JSONparse, schema_validation, ERROR_MESSAGE } from '../tools/utils.mjs';

// lowdb
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_KEYS = ['collectionid', 'document', 'id', '_id', 'password'];
const SCHEMA_FOR_KEYS = Joi.array().items(Joi.valid(...VALID_KEYS).required());
router.delete('/', async (req, res) => {
    // schema_validation------------------------------------------------------
    const [error1] = schema_validation(req, SCHEMA_FOR_KEYS, VALID_KEYS);
    if (error1) {
        return res.status(400).send({ error: error1 });
    }
    // schema_validation------------------------------------------------------



    // Load user collection----------------------------------------------------
    const collectionid = req.query.collectionid;
    if (!collectionid) return res.status(400).send({ error: 'collectionid is required' });
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);
    await db.read();
    // Load user collection----------------------------------------------------

    // Check websiterestrictions----------------------------------------------
    const websiterestrictions = db.data?.websiterestrictions?.split(',');
    if (websiterestrictions) {
        const hostname = req.hostname;
        if (websiterestrictions.indexOf(hostname) == -1) {
            return res.status(403).send({ error: '1 you are not allowed to access this collection' });
        }
    }
    // Check websiterestrictions----------------------------------------------
    // check iprestrictions----------------------------------------------------
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
    // check iprestrictions----------------------------------------------------

    // check collection found----------------------------------------------------
    if (db.data == null) {
        return res.status(404).send({ error1: 'collection not found' });
    }
    // check collection found----------------------------------------------------


    // parse document body/query-----------------------------------------------
    let query_document = req.query?.document;
    let [err, parsed_document] = JSONparse(query_document);
    if (err) return res.status(400).json({ error: err });
    // parse document body/query-----------------------------------------------

    const document = parsed_document || req.body || req.query;
    // password check-------------------------------------------------------
    const password_matches = db.data?.password === document.password;
    if (db.data?.requirepasswordtodelete && !document.password) {
        return res.status(400).json({ error: '1 password is required' });
    }
    if (db.data?.requirepasswordtodelete && document?.password !== db.data?.password) {
        return res.status(400).json({ error: '02 password is incorrect' });
    }
    // password check-------------------------------------------------------

    // get document id-------------------------------------------------------
    const keys = Object.keys(document);
    const _key = keys.find(key => key === '_id' || key === 'id');
    const id = document[_key];
    console.log('id', id);
    console.log('document', document);
    // get document id-------------------------------------------------------

    // load main index.json----------------------------------------------------
    const index_file = join(__dirname, '..', 'collections_index', 'index.json');
    const index_adapter = new JSONFile(index_file);
    const index_db = new Low(index_adapter);
    await index_db.read();
    // load main index.json----------------------------------------------------

    // deletes entire collection-----------------------------------------------
    if (!id && !collectionid) return res.status(400).json({ error: '1 id or collectionid is required' });
    if (!id && collectionid) {
        if (!document.password) return res.status(400).json({ error: '03 password is required' });
        if (!password_matches) return res.status(400).json({ error: '3 password is incorrect' });
        try {
            unlinkSync(join(__dirname, '..', 'collections', `${collectionid}.json`));
            remove(index_db.data, { collectionid: collectionid });
        } catch (error) {
            // no collection found
            return res.status(404).send({ error: 'collection not found' });
        }
        await index_db.write();
        return res.status(200).send({ message: 'Entire collection deleted' });
    }
    // deletes entire collection-----------------------------------------------

    const deleted = remove(db.data.documents, { [_key]: id });
    if (isEmpty(deleted)) { return res.status(404).send({ error5: 'document not found' }); }
    await db.write();

    // Update index.json------------------------------------------------------
    const i_db = findIndex(index_db.data, { collectionid: collectionid });
    console.log(index_db.data[i_db].updatedat);
    if (index_db.data[i_db].updatedat) index_db.data[i_db].updatedat = new Date();
    if (index_db.data[i_db].numberofdocuments) index_db.data[i_db].numberofdocuments = db.data.documents.length;
    await index_db.write();
    // Update index.json------------------------------------------------------

    if (deleted) return res.status(200).send({ message: 'document deleted', deleted: deleted });

    // fallback-------------------------------------------------------
    return res.status(404).send({ error: 'nothing done' });
    // fallback-------------------------------------------------------
});

export { router as delet }