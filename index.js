const express = require('express');
var bodyParser = require('body-parser')
const { check, validationResult } = require('express-validator');

const { readFile } = require('fs').promises;

const mcQuery = require('./mcQuery.js');

const app = express();
app.use(bodyParser.json());

// Root directory
app.get('/', async (request, response) => {

    response.send(await readFile('./index.html', 'utf8'));
});

// MC JSON get
app.get('/mc', async (request, response) => {
    
    if (typeof request.query !== 'undefined') {
        console.log("Querying " + request.query.ip + ":" + request.query.port + "...")

        await mcQuery(request.query.ip, request.query.port)
        .then((server) => response.send(server))
        .catch((err) => response.send(err));
        
    } else if (typeof request.body !== 'undefined') {
        console.log("Querying " + request.body.ip + ":" + request.body.port + "...")

        await mcQuery(request.body.ip, request.body.port)
        .then((server) => response.send(server))
        .catch((err) => response.send(err));

    } else {
        console.log("Empty request made by " + request.ip)
        response.send("No info supplied :(")
    }
    
});

// MC webpage get
app.use('/mc/:ip', async (request, response) => {
    console.log("Querying " + request.params.ip + "...")

    await mcQuery(request.params.ip)
    .then((server) => response.send(server))
    .catch((err) => response.send(err));
})

app.listen(process.env.KYPORT || 3000, () => console.log(`App available on https://api.kylixor.com`));
