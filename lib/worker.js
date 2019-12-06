/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const v1 = require('did-veres-one');
const https = require('https');
const pTimes = require('p-times');

const MAX_CONCURRENCY = 1048;

const httpsAgent = new https.Agent({
  // maxSockets: MAX_CONCURRENCY,
  rejectUnauthorized: false
});

const _silentLogger = {
  log: () => {},
  warn: () => {},
  error: () => {}
};

// a simple worker for use in node.js (as a child process)

// load workerpool
const workerpool = require('workerpool');

async function sendOperations({hostname, operationsPerSecond}) {
  try {
    const options = {concurrency: MAX_CONCURRENCY};
    await pTimes(operationsPerSecond, () => sendOperation({hostname}), options);
  } catch(e) {
    console.error(e);
  }
}

const _cache = {};

async function sendOperation({hostname}) {
  try {
    let veresDriver;
    if(_cache[hostname]) {
      veresDriver = _cache[hostname];
    } else {
      const options = {mode: 'dev', httpsAgent, hostname, logger: _silentLogger};
      veresDriver = v1.driver(options);
    }
    const didDocument = await veresDriver.generate({});
    await veresDriver.register({didDocument});
  } catch(e) {
    if(e.response) {
      const {data, status} = e.response;
      if(status !== 204) {
        const err = new Error(
          'Error sending event: server did not respond with 204.');
        console.error('ERROR', err);
        console.error('statusCode', status);
        console.error('body', JSON.stringify(data, null, 2));
      } else {
        console.error('ERROR', e);
        console.error('statusCode', status);
        console.error('body', JSON.stringify(data, null, 2));
      }
    } else {
      console.error(e);
    }
  }
}

// create a worker and register public functions
workerpool.worker({sendOperations});
