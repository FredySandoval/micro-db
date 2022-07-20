import { Router } from 'express';
const router = Router();

import { unlinkSync } from 'fs';
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

router.delete('/', async (req, res) => {
    const DELETE_ENTIRE_COLLECTION = req.body.deleteentirecollection || req.query.deleteentirecollection;
    // schema_validation------------------------------------------------------
    const [error1] = query_keys_validation(req, VALID_KEYS);
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 });
    // schema_validation------------------------------------------------------


    // Load user collection----------------------------------------------------
    const collectionid = req.query.collectionid;
    if (!collectionid) return res.status(400).send({ error: 'collectionid is required' });
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);
    await db.read();

    // Check restrictions-------------------------------------------------------
    const [error3] = check_restrictions(WHICH_FILE, req, db)
    if (error3) return res.status(403).send({ error: error3 });

    // check collection found----------------------------------------------------
    if (db.data == null) {
        return res.status(404).send({ error1: 'collection not found' });
    }

    // password check-------------------------------------------------------
    const [password_valid] = is_password_valid(req, db);

    // get document id-------------------------------------------------------
    const [_key, id] = get_document_key_id(req);

    // load main index.json----------------------------------------------------
    const index_file = join(__dirname, '..', 'collections_index', 'index.json');
    const index_adapter = new JSONFile(index_file);
    const index_db = new Low(index_adapter);
    await index_db.read();

    // deletes entire collection-----------------------------------------------
    if (!id && !collectionid) return res.status(400).json({ error: '1 id or collectionid is required' });
    if (!id && collectionid) {
        if (!password_valid) return res.status(403).json({ error: 'd4 - password is invalid or not present' });
        if (!DELETE_ENTIRE_COLLECTION) return res.status(400).json({ error: 'add deleteentirecollection to query if you want to delete entire collection' });
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

    // remove document-------------------------------------------------------
    if (db.data.requirepasswordtodelete && !password_valid) return res.status(403).json({ error: 'd5 - password is invalid or not present' });
    const deleted = remove(db.data.documents, { [_key]: id });
    if (isEmpty(deleted)) { return res.status(404).send({ error5: 'document not found' }); }
    await db.write();

    // Update index.json------------------------------------------------------
    const i_db = findIndex(index_db.data, { collectionid: collectionid });
    if (i_db == -1) return res.status(404).send({ error: 'collection not found' });
    index_db.data[i_db].updatedat = new Date();
    index_db.data[i_db].numberofdocuments = db.data.documents.length;
    await index_db.write();
    // Update index.json------------------------------------------------------

    if (deleted) return res.status(200).send({ message: 'document deleted', deleted: deleted });

    // fallback-------------------------------------------------------
    return res.status(404).send({ error: 'nothing done' });
    // fallback-------------------------------------------------------
});

export { router as delet }