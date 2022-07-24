const axios = require('axios');
const baseUrl = 'http://localhost:5000';
const {
    BASIC_COLLECTION,
    FULL_COLLECTION } = require('../tools/schema_for_test.js');

const collectionIds = [];
const documentIds = [];

const basic_collection = {
    collectionname: "My Collection Name",
    email: "shockerovip@gmail.com",
    password: "randompass1",
    requirepasswordtodelete: true,
    // websiterestrictions: ["google.com", "localhost"], // production only
    // iprestrictions: ["127.0.0.1"], // production only
    schema: {
        type: "object",
        properties: {
            foo: { "type": "array", "items": { "type": "string" }, "maxItems": 3 },
            bar: { "type": "string", "maxLength": 3, "minLength": 1 },
            fooo: { "type": "number", "minimum": 1, "maximum": 10 },
            bax: { "type": "boolean" },
            baz: { "type": "object", "minProperties": 1, "maxProperties": 3, "required": ["foo", "bar"] }
        },
        required: ["foo", "bar", "fooo"],
        additionalProperties: false
    }
};
const updated_collection = {
    collectionname: "MyNew Collection",
    requirepasswordtodelete: true,
    // websiterestrictions: ["maple.com", "localhost"],
    // iprestrictions: ["127.0.0.1"],
    schema: {
        type: "object",
        properties: {
            name: {
                type: "string"
            },
            age: {
                type: "number"
            }
        },
        required: ["name"],
        additionalProperties: false
    }
}
async function sleep(time) {
    await new Promise(r => setTimeout(r, time));
}
// beforeEach(async () => {
//     // await new Promise(r => setTimeout(r, 500));
//     await sleep(500);
// })
it('Create basic collection', async () => {
    const cc = await axios.post(`${baseUrl}/createcollection`);
    collectionIds.push(cc.data.collectionid);
    expect(cc.status).toBe(200);
    expect(cc).toHaveProperty('data');
    const isValid = BASIC_COLLECTION.validate(cc.data);
    // expect(isValid.error === undefined).toBe(true);
});

it('create basic collection, not valid query', async () => {
    try {
        const cc = await axios.post(`${baseUrl}/createcollection?random=random`);
    } catch (error) {
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.status).toBe(400);
    }
})

it('create full collection', async () => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    const cc = await axios.post(`${baseUrl}/createcollection`, basic_collection, config);
    collectionIds.push(cc.data.collectionid);
    expect(cc.status).toBe(200);
    expect(cc).toHaveProperty('data');
    const isValid = FULL_COLLECTION.validate(cc.data);
    // expect(isValid.error === undefined).toBe(true);
});

it('update the collection itself', async () => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const cc = await axios.patch(`${baseUrl}/admin?collectionid=${collectionIds[1]}&password=randompass1`, updated_collection, config);
    expect(cc.status).toBe(200);
    expect(cc).toHaveProperty('data');
})

it('add a document to the collection', async () => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    const document = {
        foo: ["foo", "bar", "baz"],
        bar: "bar",
        fooo: 1,
        bax: true,
        baz: { foo: "foo", bar: "bar" }
    }
    const dd = await axios.post(`${baseUrl}/insert?collectionid=${collectionIds[0]}`, document, config);
    documentIds.push(dd.data._id);
    expect(dd.status).toBe(200);
    expect(dd).toHaveProperty('data');
});

it('find the document in the collection', async () => {
    const url = `${baseUrl}/find?collectionid=${collectionIds[0]}&_id=${documentIds[0]}`;
    const dd = await axios.get(url);
    expect(dd.status).toBe(200);
    expect(dd).toHaveProperty('data');
});

it('update the document in the collection', async () => {
    const url = `${baseUrl}/update?collectionid=${collectionIds[0]}`;
    const document = {
        _id: documentIds[0],
        foo: ["fo1", "ba2", "ba3"],
        bar: "bax",
        fooo: 2,
        bax: false,
        baz: { foo: "fo2", bar: "ba3" }
    }
    const dd = await axios.patch(url, document);
    expect(dd.status).toBe(200);
    expect(dd.data).toHaveProperty('data');
    expect(dd.data).toHaveProperty('removed');
});

it('delete the document in the collection', async () => {
    const url = `${baseUrl}/delete?collectionid=${collectionIds[0]}&_id=${documentIds[0]}`;
    const dd = await axios.delete(url);
    expect(dd.status).toBe(200);
    expect(dd).toHaveProperty('data');
});

it('Expected confirmation on delete Collections', async () => {
    try {
        const dc = await axios.delete(`${baseUrl}/delete?collectionid=${collectionIds[0]}`);
    } catch (error) {
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.status).toBe(400);
    }
});

it('Delete collection successfuly', async () => {
    const dc = await axios.delete(`${baseUrl}/delete?collectionid=${collectionIds[0]}&password=randompass1&deleteentirecollection=true`);
    expect(dc.status).toBe(200);
    expect(dc).toHaveProperty('data');
})
it('Delete collection successfuly', async () => {
    let dc;
    try {
        dc = await axios.delete(`${baseUrl}/delete?collectionid=${collectionIds[1]}&password=randompass1&deleteentirecollection=true`);
    } catch (error) {
       console.log('erro1', error); 
    }
    expect(dc.status).toBe(200);
    expect(dc).toHaveProperty('data');
})