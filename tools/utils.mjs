// import Joi from 'joi';


// const ERROR_MESSAGE = {
//     "unknown_pattern": "please use this pattern /find?collectionid=<collectionid>",
//     "not_valid": (incorrect, correct) => `${incorrect} is invalid, please use ${correct}`,
// }

// function schema_validation(req, res, valid_keys) {
//     const schema_for_keys = Joi.array().items(Joi.valid(...valid_keys).required());
//     const keys = Object.keys(req.query);
//     const { error } = schema_for_keys.validate(keys);
//     if (error) {
//         if (error.details[0].type == 'array.includesRequiredUnknowns') {
//             return res.status(400).send({ error: ERROR_MESSAGE.unknown_pattern });
//         }
//         const incorrect = error?.details[0]?.context?.value;
//         const message = ERROR_MESSAGE.not_valid(incorrect, valid_keys);
//         return res.status(400).send({ error: message });
//     }
// }
// import ipRangeCheck from 'ip-range-check';

// function check_restriction(req, res, db) {
//     // check websiterestrictions
//     const websiterestrictions = db.data?.websiterestrictions?.split(',');
//     if (websiterestrictions) {
//         const hostname = req.hostname;
//         if (websiterestrictions.indexOf(hostname) == -1) {
//             return res.status(403).send({ error: '1 you are not allowed to access this collection' });
//         }
//     }
//     // check iprestrictions
//     const iprestrictions = db.data?.iprestrictions?.split(',');
//     if (iprestrictions) {
//         const ip = req.ip;
//         const checkip = iprestrictions.some(iprange => {
//             if (ipRangeCheck(ip, iprange)) {
//                 return true;
//             }
//         })
//         if (!checkip) {
//             return res.status(403).json({ error: '2 you are not allowed to access this collection' });
//         }
//     }
// }
// function  validate_brackets(expr){
//     const holder = []
//     const openBrackets = ['(','{','[','\'','"']
//     const closedBrackets = [')','}',']' ,'\'','"']
//     for (let letter of expr) { // loop trought all letters of expr
//         if(openBrackets.includes(letter)){ // if its oppening bracket
//             holder.push(letter)
//         }else if(closedBrackets.includes(letter)){ // if its closing
//             const openPair = openBrackets[closedBrackets.indexOf(letter)] // find its pair
//             if(holder[holder.length - 1] === openPair){ // check if that pair is the last element in the array
//                 holder.splice(-1,1) // if so, remove it
//             }else{ // if its not
//                 holder.push(letter)
//                 break // exit loop
//             }
//         }
//     }
//     return (holder.length === 0) // return true if length is 0, otherwise false
// }

// const ERROR_MESSAGE = {
//     "invalid": (invalid) => `2 - ${invalid} is invalid`
// }
const ERROR_MESSAGE = {
    "no_json": "1 - no JSON object found",
    "unknown_pattern": "please use this pattern /find?collectionid=<collectionid>",
    "not_valid": (incorrect, correct) => `${incorrect} is invalid, please use ${correct}`,
    "invalid": (THIS_FILE, invalid) => `${THIS_FILE} - ${invalid} is invalid`,
    "unallowed": (THIS_FILE, invalid) => `${THIS_FILE} - ${invalid} is unallowed`,
}
/**
 * 
 * This function attempts to parse a string to JSON.
 * if fails then treats the string as CSV and return an Object if successful
 * otherwise does nothing and return null
 * @param {string} json_object - string to parse
 * @returns [error, result] - [null, parsed object] or [error, null]
 */
function JSONparse(json_object) {
    if (!json_object) return [null, null];
    if (typeof json_object === 'string') {
        try {
            console.log('json_object', json_object);
            // replace all single quotes with double quotes so that it can be parsed
            json_object = json_object.replace(/\'/g, '\"');
            return [null, JSON.parse(json_object)];
        } catch (error) {
            var temp = json_object.split(","), theobj = {};
            if (temp.length < 2 || temp.length % 2 != 0) {
                return [ERROR_MESSAGE.invalid(json_object), null];
            }
            for (let i = 0; i < temp.length; i += 2) {
                // little check value is number or boolean if it is then parse it.
                temp[(i + 1)] = /^\d+$/.test(temp[(i + 1)]) ? Number(temp[i + 1]) : temp[(i + 1)];
                temp[(i + 1)] = temp[(i + 1)] === "true" || temp[(i + 1)] === "false" ? Boolean(temp[(i + 1)]) : temp[(i + 1)];
                theobj[temp[i]] = temp[(i + 1)];
            }
            return [null, theobj];
        }
    }
    // fallback
    return [null, null];

}

function schema_validation(req, SCHEMA_FOR_KEYS, VALID_KEYS) {
    const keys = Object.keys(req.query);
    const { error } = SCHEMA_FOR_KEYS.validate(keys);
    if (error) {
        if (error.details[0].type == 'array.includesRequiredUnknowns') {
            return [ERROR_MESSAGE.unknown_pattern];
        }
        const incorrect = error?.details[0]?.context?.value;
        const message = ERROR_MESSAGE.not_valid(incorrect, VALID_KEYS);
        return [message];
    }
    return [null];
}
import ipRangeCheck from 'ip-range-check';
function check_restrictions(WICH_FILE, req, db) {
    // check websiterestrictions
    if (db.data?.websiterestrictions) {
        const origin = req.get('origin');
        if (db.data?.websiterestrictions.indexOf(origin) == -1) {
            return [ERROR_MESSAGE.unallowed(WICH_FILE, 'domain')];
        }
    }
    // check iprestrictions
    if (db.data?.iprestrictions) {
        // const ip = req.ip;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const checkip = db.data?.iprestrictions?.some(iprange => {
            if (ipRangeCheck(ip, iprange)) {
                return true;
            }
        })
        if (!checkip) {
            return [ERROR_MESSAGE.unallowed(WICH_FILE, 'ip')];
        }
    }
    return [null];
}
import bcript from 'bcryptjs';
function is_password_valid(req, db) {
    const password = req.body?.password || req.query?.password;
    if (db.data?.password) {
        // hashed password 
        if (!password) return [false]
        const password_matches = bcript.compareSync(password, db.data?.password);
        return [password_matches];
        // const password_matches =  password == db.data?.password;
        // if (db.data?.requirepasswordtodelete && !req.query.password) {
        //     return [ERROR_MESSAGE.invalid(', WHICH_FILE', 1 - password)];
        //     // return res.status(403).send({ error: '1 password required' });
        // }
        // if (db.data?.requirepasswordtodelete && !password_matches) {
        //     return [ERROR_MESSAGE.invalid(WHICH_FILE, '2-password')];
        //     // return res.status(403).send({ error: '2 password incorrect' });
        // }
    }
    return [true];
}

function query_keys_validation(req, VALID_KEYS) {
    const query_keys = Object.keys(req.query);
    if (query_keys.length === 0)
        return ['no query keys found'];
    if (query_keys.length > VALID_KEYS.length)
        return ['invalid query keys'];
    const query_check = query_keys.every(key => VALID_KEYS.includes(key) === true);
    if (!query_check)
        return [`use only ${VALID_KEYS}`];
    return [null];
}

function get_document_key_id(req) {
    let keys = [];
    keys.push(...Object.keys(req.body));
    keys.push(...Object.keys(req.query));
    const _key = keys.find(key => key === '_id' || key === 'id');
    const id = req.body[_key] || req.query[_key];
    return [_key, id];
}

export {
    JSONparse,
    schema_validation,
    ERROR_MESSAGE,
    // check_password,
    is_password_valid,
    check_restrictions,
    query_keys_validation,
    get_document_key_id
};