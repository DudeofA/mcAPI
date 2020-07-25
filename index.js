const express = require('express');
const bodyParser = require('body-parser');
const { readFile } = require('fs').promises;

const mcQuery = require('./mcQuery.js');

const app = express();
app.use(bodyParser.json());

if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}

// Root directory
app.get('/', async (request, response) => {

    response.send(await readFile('./index.html', 'utf8'));
});

// MC JSON get
app.get('/mc', async (request, response) => {

    if (request.query.ip !== undefined) {
        console.log("[MC] Querying from query " + request.query.ip + ":" + request.query.port + "...")

        await mcQuery(request.query.ip, request.query.port)
        .then((server) => response.send(server))
        .catch((err) => response.send(err));
        
    } else if (request.body.ip !== undefined) {
        console.log("[MC] Querying from body " + request.body.ip + ":" + request.body.port + "...")

        await mcQuery(request.body.ip, request.body.port)
        .then((server) => response.send(server))
        .catch((err) => response.send(err));

    } else {
        response.send(await readFile('./mc.html', 'utf8'));
    }
    
});

// MC webpage get
app.use('/mc/:ip', async (request, response) => {
    console.log("[MC] Querying " + request.params.ip + "...")

    await mcQuery(request.params.ip)
    .then((server) => response.send(server))
    .catch((err) => response.send(err));
})

var server = app.listen(process.env.KYPORT || 3000, () => {
    console.log(`App available on https://api.kylixor.com on port ` + server.address().port);
});
