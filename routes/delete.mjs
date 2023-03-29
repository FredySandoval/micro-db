import { Router } from 'express';
const router = Router();

import { unlinkSync, unlink, existsSync } from 'fs';
import { remove, findIndex, isEmpty } from 'lodash-es'
import {
    is_password_valid,
    check_restrictions,
    query_keys_validation,
    get_document_key_id,
} from '../tools/utils.mjs';

// lowdb
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_KEYS = ['collectionid', 'id', '_id', 'password', 'deleteentirecollection'];
const WHICH_FILE = "D - "

// load main index.json----------------------------------------------------
const index_file = join(__dirname, '..', 'collections_index', 'index.json');
const index_adapter = new JSONFile(index_file);
const index_db = new Low(index_adapter);
router.delete('/', async (req, res) => {
    // schema_validation------------------------------------------------------
    const [error1] = query_keys_validation(req, VALID_KEYS);
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 });
    // get document id-------------------------------------------------------
    const [_key, id] = get_document_key_id(req);

    // Load user collection----------------------------------------------------
    const collectionid = req.query.collectionid;
    if (!collectionid) return res.status(400).send({ error: 'collectionid is required' });
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);

    await db.read();
    await index_db.read();

    // Check restrictions-------------------------------------------------------
    const [error3] = check_restrictions(WHICH_FILE, req, db)
    if (error3) return res.status(403).send({ error: error3 });

    // check collection found----------------------------------------------------
    if (db.data == null) {
        return res.status(404).send({ error1: 'D-2 collection not found' });
    }
    // password check-------------------------------------------------------
    const [password_valid] = is_password_valid(req, db);

    // deletes the collection only
    if (_key && id && typeof id === 'string' && id.length > 0) {
        if (db.data.requirepasswordtodelete && !password_valid)
            return res.status(403).json({ error: 'd5 - password is invalid or not present' });
        const deleted = remove(db.data.documents, { [_key]: id });
        if (isEmpty(deleted)) { return res.status(404).send({ error5: 'document not found' }); }

        const i_db = findIndex(index_db.data, { collectionid: collectionid });
        if (i_db == -1) return res.status(404).send({ error: 'd-0 collection not found' });
        index_db.data[i_db].updatedat = new Date();
        index_db.data[i_db].numberofdocuments = db.data.documents.length;

        await db.write();
        await index_db.write();

        return res.status(200).send(deleted);
    }

    const DELETE_ENTIRE_COLLECTION = req.body.deleteentirecollection || req.query.deleteentirecollection;
    // deletes entire collection-----------------------------------------------
    if (!id && !collectionid) return res.status(400).json({ error: '1 id or collectionid is required' });
    if (!id && collectionid) {
        if (!password_valid) return res.status(403).json({ error: 'd4 - password is invalid or not present' });
        if (!DELETE_ENTIRE_COLLECTION) return res.status(400).json({ error: 'add deleteentirecollection to query if you want to delete entire collection' });
        try {
            const t = remove(index_db.data, { collectionid: collectionid });
            await index_db.write();
            if (t) unlinkSync(join(__dirname, '..', 'collections', `${collectionid}.json`));
            // if (t) unlink(join(__dirname, '..', 'collections', `${collectionid}.json`));
        } catch (error) {
            // no collection found
            return res.status(404).send({ error: 'd-4 collection not found' });
        }
        return res.status(200).send({ data: 'Entire collection deleted' });
    }
    return res.status(400).send({ error: 'd-3 fall back' });
});

export { router as delet };