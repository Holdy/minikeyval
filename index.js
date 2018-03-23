"use strict";

let express = require('express');
let http = require('http');
let bodyParser = require('body-parser');

let app = express();
let inMemoryMap = {};

app.use(bodyParser.json({ 'limit': '2mb' }));

var server = http.createServer(app);

function start(port, callback) {

    app.get('/keyval/get/:key', function(req, res) {
        let data = inMemoryMap[req.params.key];

        let result = data ?
            data :
            {
                'error': 'No data for key.'
            };

        respond(res, 200, result, true);
    });

    app.post('/keyval/set/:key', function(req, res) {
        var apiKeyFromHeader = req.headers['api-key'];

        if (apiKeyFromHeader) {
            if (apiKeyFromHeader === process.env.MKV_SET_API_KEY) {

                inMemoryMap[req.params.key] = {
                    set_ms: Date.now(),
                    data: req.body
                };
                respond(res, 200, {result: "OK"});
            } else {
                respond(res, 400, {'error': 'api-key was not recognised.'});
            }

        } else {
            respond(res, 400, {'error': 'api-key header was not specified.'});
        }
    });

    server.listen(port, callback);
}

function respond(res, statusCode, bodyJson, prettyPrint) {
    if (prettyPrint) {
        res.status(statusCode);
        res.setHeader('Content-Type', 'application/json');

        let originalUrl = res.req.originalUrl;
        let refreshValue = res.req.query.refresh;

        if (refreshValue || refreshValue === '') {
            let secondsBeforeRefresh = numberOr(refreshValue, 15);
            res.setHeader('Refresh', secondsBeforeRefresh + '; url=' + originalUrl);
        }
        res.send(JSON.stringify(bodyJson, false, 3));
    } else {
        res.status(statusCode).send(bodyJson);
    }
}

function numberOr(text, defaultNumber) {
    if (text === '') {
        return defaultNumber;
    }
    let result = Number(text);
    return Number.isNaN(result) ? defaultNumber : result;
}


start(Number(process.env.PORT || 80), null);
