import express from 'express';
import { networkInterfaces } from 'os';
const app = express();
app.set('trust proxy', 4);
app.use(express.json());

app.get('/ip', (request, response) => response.send(request.ip));

import { limit_50max_15min } from './rate_limits/ratelimits.mjs';
import { createcollection } from './routes/createcollection.mjs';
app.use('/createcollection', limit_50max_15min, createcollection);


import { limit_1000max_60min } from './rate_limits/ratelimits.mjs';
import { find } from './routes/find.mjs';
app.use('/find', limit_1000max_60min, find);

import { insert } from './routes/insert.mjs';
app.use('/insert', limit_1000max_60min, insert);

import { update } from './routes/update.mjs';
app.use('/update', limit_1000max_60min, update);

import { delet } from './routes/delete.mjs';
app.use('/delete', limit_1000max_60min, delet );

import { admin } from './routes/admin.mjs';
app.use('/admin', limit_1000max_60min, admin);

if (!process.env.production) {
    var interfaces = networkInterfaces(), localhostIP;
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            let ipFamily = interfaces[k][k2].family;
            if (ipFamily === 'IPv4' || ipFamily === 4 && !interfaces[k][k2].internal) {
                localhostIP = interfaces[k][k2].address;
            }
        }
    }
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
    if (!process.env.production) {
        console.log(`Listening on http://${localhostIP}:${port}`);
    }
});