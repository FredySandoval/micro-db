import { Router } from "express";
const router = Router();

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Low, JSONFile } from 'lowdb'
import { check_restrictions, is_password_valid, query_keys_validation } from "../tools/utils.mjs";
import { validate_updated_collection } from "../tools/schema_validations.mjs";
import { isEmpty, assign, omit } from "lodash-es";

const VALID_KEYS = ['collectionid', 'password'];
const WHICH_FILE = "A - ";
const SCHEMA_FOR_ADMIN_UPDATE_KEYS = [
    'collectionname',
    'requirepasswordtodelete',
    'websiterestrictions',
    'iprestrictions',
    'schema'
];

const __dirname = dirname(fileURLToPath(import.meta.url));
router.patch("/", async (req, res) => {
    const isBodyEmpty = isEmpty(req.body);
    if (isBodyEmpty) return res.status(400).send({ error: "body is empty" });
    // schema validation
    const [error1] = query_keys_validation(req, VALID_KEYS);
    if (error1) return res.status(400).send({ error: WHICH_FILE + error1 });

    // Load user collection----------------------------------------------------
    const collectionid = req.query.collectionid;
    if (!collectionid) return res.status(400).send({ error: 'collectionid is required' });
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);
    await db.read();

    // check collection found----------------------------------------------------
    if (db.data == null) {
        return res.status(404).send({ error1: 'collection not found' });
    }
    // pasword check 
    const [password_valid] = is_password_valid(req, db);

    if (collectionid) {
        if (!password_valid)
            return res.status(403).send({ error: 'password is invalid' });

        const [error_4] = validate_updated_collection(req.body);
        if (error_4) return res.status(400).send({ error: WHICH_FILE + error_4 });

        // update collection
        SCHEMA_FOR_ADMIN_UPDATE_KEYS.forEach(key => {
            if (req.body[key]) {
                assign(db.data, { [key]: req.body[key] });
            }
        });
        await db.write();
        omit(db.data, ['password', 'document'])
        return res.status(200).json({ data: omit(db.data, ['password', 'documents']) });
    }
});

export { router as admin };