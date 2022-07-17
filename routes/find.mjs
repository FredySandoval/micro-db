import { Router } from 'express';
const router = Router();
import Joi from 'joi';
import ipRangeCheck from 'ip-range-check';
import { find } from "lodash-es";
// import { nanoid } from 'nanoid';
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url));

let valid_keys = ['collectionid', '_id', 'id'];
const schema_keys = Joi.array().items(Joi.valid(...valid_keys).required());


router.get('/', async (req, res) => {

    // schema validation
    const keys = Object.keys(req.query);
    const { error } = schema_keys.validate(keys);
    if (error) {
        if (error.details[0].type == 'array.includesRequiredUnknowns') {
            return res.status(400).send({ error: 'please use this pattern /find?collectionid=<collectionid>' });
        }
        const contextvalue = error?.details[0]?.context?.value;
        const message = `${contextvalue} not valid, please use ${valid_keys}`;
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
   const websiterestrictions = db.data.websiterestrictions?.split(',');
    if (websiterestrictions) {
        const hostname = req.hostname;
        if (websiterestrictions.indexOf(hostname) == -1) {
            return res.status(403).send({ error: '1 you are not allowed to access this collection' });
        }
    }
    // check iprestrictions
    const iprestrictions = db.data.iprestrictions?.split(',');
    if (iprestrictions) {
        const ip = req.ip;
        const checkip = iprestrictions.some(iprange => {
            if (ipRangeCheck(ip, iprange)) {
                return true;
            }
        })
        if (!checkip) {
            return res.status(403).send({ error: '2 you are not allowed to access this collection' });
        }
    }

    const documents = db?.data?.documents;
    const temp_id = req.query._id || req.query.id;
    const tempid = req.body._id || req.body.id;
    const id = temp_id || tempid; 
    if ( id ) {
        const document = find(documents, { _id: id });
        console.log('document', document);
        return res.status(200).json({data: document});
    }
    res.status(200).json({data: documents});
});

export { router as find }