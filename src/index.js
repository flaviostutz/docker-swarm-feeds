"use strict";

const logger = require('console-server');
const express = require('express');
const bodyParser  = require('body-parser');
const DomainsFeed = require('./DomainsFeed');

const PORT = 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

DomainsFeed.config(app);

app.get('/', (req, res) => {
    res.redirect('/traefik-domains?format=html');
})

app.get('/health', (req, res) => {
    res.send('OK');
});

let server = app.listen(PORT, function () {
    logger.info(`running on port  ${PORT}`);
});

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function info() {
    console.log('DOCKER INFO');
    const res = await exec('docker info');
    console.log(`${res.stdout}`);
}
info();


server.timeout = 15000;

