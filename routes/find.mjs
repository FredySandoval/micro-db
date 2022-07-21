import { Router } from 'express';
const router = Router();
import { find } from "lodash-es";
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import { check_restrictions, get_document_key_id, query_keys_validation } from '../tools/utils.mjs';
const __dirname = dirname(fileURLToPath(import.meta.url));

const WHICH_FILE = "f - "
const VALID_KEYS = ['collectionid', '_id', 'id'];

router.get('/', async (req, res) => {
    
    // query validation
    const [error1] = query_keys_validation(req, VALID_KEYS)
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 })

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

    // Check restrictions
    const [error2] = check_restrictions(WHICH_FILE, req, db);
    if (error2) return res.status(403).send({ error: error2 });


    // check db.data.websiterestrictions
    const [error3] = check_restrictions(WHICH_FILE, req, db);
    if (error3) return res.status(403).send({ error: error3 });

    const documents = db?.data?.documents;
    const [_key, id] = get_document_key_id(req);
    if (id) {
        const document = find(documents, { _id: id });
        if (!document) return res.status(404).send({ error: 'document not found' });
        return res.status(200).json({ data: document });
    }
    res.status(200).json( documents );
});

export { router as find }