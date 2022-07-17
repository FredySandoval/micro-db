import { Router } from 'express';
const router = Router();
import Joi from 'joi';
import isCidr from 'is-cidr';
import net from 'net';
import { schema_validation } from '../tools/utils.mjs';
import { nanoid } from 'nanoid';
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url));
let VALID_KEYS = ['email', 'password', 'collectionname', 'requirepasswordtodelete', 'websiterestrictions', 'iprestrictions', 'schema'];
const schema_keys = Joi.array().items(Joi.valid(...VALID_KEYS));

router.post('/', async (req, res) => {
    const keys = Object.keys(req.query)
    const { error } = schema_keys.validate(keys);
    if (error) {
        const contextvalue = error?.details[0]?.context?.value;
        const message = `${contextvalue} not valid, please use ${VALID_KEYS}`;
        return res.status(400).send({ error: message });
    }
    const collectionid = nanoid();
    const collectionname = req.query.collectionname;
    const email = req.query.email;
    const password = req.query.password;
    const allowdelete = req.query.allowdelete;
    const requirepasswordtodelete = req.query.requirepasswordtodelete;
    const schema = req.query.schema || req.body.schema;
    const websiterestrictions = req.query.websiterestrictions;
    const iprestrictions = req.query.iprestrictions;

    if (websiterestrictions && !password) {
        return res.status(400).send({ error: 'if websiterestrictions set, provide password, to prevent being locked out' });
    }

    // check if ip addresses are valid
    if (iprestrictions) {
        const iprestrictions_array = iprestrictions.split(',');
        const iprestrictions_valid = iprestrictions_array.every(ip => {
            return (net.isIPv4(ip) || net.isIPv6(ip) || isCidr(ip) !== 0);
        });
        if (!iprestrictions_valid) {
            return res.status(400).send({ error: 'invalid ip address detected, please use ipv4, ipv6, or cidr e.g. 192.168.0.1/24' });
        }
    }
    // schema JSON treatment
    let json_schema
    if (schema) {
        if (typeof schema == 'string') {
            try {
                json_schema = JSON.parse(schema);
            }
            catch (e) {
                return res.status(400).send({ error: '1 schema is not valid JSON' });
            }
        }
        if (!json_schema || typeof json_schema != 'object') {
            return res.status(400).send({ error: '2 schema is not valid JSON' });
        }
    }
    // end schema JSON treatment
    const file = join(__dirname, '..', 'collections', `${collectionid}.json`);
    const adapter = new JSONFile(file);
    const db = new Low(adapter);

    const date = new Date();
    const newCollection = {
        collectionid: collectionid,
        createdat: date,
        updatedat: date,
        collectionname: collectionname,
        email: email,
        password: password,
        allowdelete: allowdelete,
        requirepasswordtodelete: requirepasswordtodelete,
        schema: json_schema,
        websiterestrictions,
        iprestrictions,
        documents: []
    };

    db.data = newCollection;

    await db.write()

    const index_file = join(__dirname, '..', 'collections_index', 'index.json');
    const index_adapter = new JSONFile(index_file);
    const index_db = new Low(index_adapter);
    await index_db.read();
    index_db.data.push({
        collectionid: collectionid,
        createdat: date,
        updatedat: date,
        numberofdocuments: 0,
    });

    await index_db.write();
    res.json(newCollection);
});

export { router as createcollection };