import { Router } from 'express';
const router = Router();
import bcript from 'bcryptjs'
import { isEmpty } from 'lodash-es';
import { validate_new_collection } from '../tools/schema_validations.mjs';
import { nanoid } from 'nanoid';
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import { existsSync,writeFileSync } from 'fs';


const __dirname = dirname(fileURLToPath(import.meta.url));
// Load index.js file
const index_file = join(__dirname, '..', 'collections_index', 'index.json');
// check if index.json file exists if not create it
if (!existsSync(index_file)) {
    writeFileSync(index_file, '[]');
}
const index_adapter = new JSONFile(index_file);
const index_db = new Low(index_adapter);

router.post('/', async (req, res) => {
    await index_db.read();
    const body = !isEmpty(req.body) ? req.body : null;
    const new_collection_data = body || req.query;

    if (typeof new_collection_data !== 'object') return res.status(400).send({ error: 'Invalid request body' });
    if (!new_collection_data.collectionname) new_collection_data.collectionname = 'Untitled';

    Object.assign(new_collection_data, { collectionid: nanoid() });
    Object.assign(new_collection_data, { createdat: new Date().toISOString() });
    Object.assign(new_collection_data, { updatedat: new Date().toISOString() });
    Object.assign(new_collection_data, { documents: [] });

    const keys_to_parse = ['websiterestrictions', 'iprestrictions', 'schema'];
    for (let key of keys_to_parse) {
        if (typeof new_collection_data[key] === 'string') {
            try {
                new_collection_data[key] = new_collection_data[key].replace(/\'/g, '\"');
                new_collection_data[key] = JSON.parse(new_collection_data[key]);
            } catch (error) {
                return res.status(400).send({ error: `Invalid JSON in ${key}` });
            }

        }
    }

    const [error_1] = validate_new_collection(new_collection_data);
    if (error_1) {
        return res.status(400).send({ error: error_1.details });
    }

    // Hash password
    let password_length;
    if (new_collection_data.password) {
        password_length = new_collection_data.password.length;
        const salt = await bcript.genSalt(10);
        const hashed_password = await bcript.hash(new_collection_data.password, salt);
        new_collection_data.password = hashed_password;
    }
    const file = join(__dirname, '..', 'collections', `${new_collection_data.collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);

    db.data = new_collection_data;
    await db.write()
    // fill the password with * characters
    if (new_collection_data.password) new_collection_data.password = '*'.repeat(password_length);

    index_db.data.push({
        collectionid: new_collection_data.collectionid,
        createdat: new_collection_data.createdat,
        updatedat: new_collection_data.updatedat,
        numberofdocuments: 0,
    });

    await index_db.write();
    res.json(new_collection_data);
});

export { router as createcollection };