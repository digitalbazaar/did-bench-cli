/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const v1 = require('did-veres-one');
const https = require('https');
const jsigs = require('jsonld-signatures');
const pTimes = require('p-times');
const _timer = require('./timer');
const {
  suites: {Ed25519Signature2018}
} = jsigs;
const {CapabilityInvocation} = require('ocapld');

const CLIENTS_PER_HOST = 4;
const DEFAULT_CONCURRENCY = 250;

const _logger = new Proxy({}, {
  get() {
    return () => {};
  }
});

const _cache = new Map();

async function _getDriver({mode, hostname}) {
  let drivers = _cache.get(hostname);
  if(drivers === undefined) {
    drivers = new Array(CLIENTS_PER_HOST);
    // generate drivers for host
    for(let i = 0; i < CLIENTS_PER_HOST; i++) {
      const httpsAgent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
      });

      const options = {mode, httpsAgent, hostname, logger: _logger};
      const veresDriver = v1.driver(options);
      // initialize driver by getting leger agent status
      await veresDriver.client.ledger.getAgent();
      drivers[i] = veresDriver;
    }
    _cache.set(hostname, drivers);
  }

  return drivers[Math.floor(Math.random() * CLIENTS_PER_HOST)];
}

exports.sendOperations = async ({
  mode,
  hostname,
  operationCount,
  concurrency = DEFAULT_CONCURRENCY
} = {}) => {
  try {
    const options = {concurrency};
    const stats = await pTimes(operationCount, async () => {
      const {client, operation} = await exports.createOperation(
        {mode, hostname});
      return exports.sendOperation({client, operation});
    }, options);
    // collect useful stats
    const result = {
      total: 0,
      ok: 0,
      error: 0,
      NetworkError: 0,
      ECONNRESET: 0
    };
    for(const s of stats) {
      result.total++;
      if(s.status === 'ok') {
        result.ok++;
      } else if(s.status === 'error') {
        result.error++;
        if(s.error.name === 'NetworkError') {
          result.NetworkError++;
          if(s.error.code === 'ECONNRESET') {
            result.ECONNRESET++;
          }
        }
      }
    }
    result.data = stats;
    return result;
  } catch(e) {
    console.error('worker error', e);
  }
};

exports.sendOperation = async ({client, operation}) => {
  try {
    const now = Date.now();

    const timer = _timer();
    await client.sendOperation({operation});
    const duration = timer.elapsed();

    return {
      status: 'ok',
      monitor: {
        start: (new Date(now)).toISOString(),
        end: (new Date(now + duration)).toISOString(),
        duration
      }
    };
  } catch(e) {
    const result = {
      status: 'error'
    };
    if(e.name === 'NetworkError') {
      result.error = {
        name: 'NetworkError',
        code: e.details.error.code
      };
    } else {
      //console.error('ERROR', e);
      console.error('ERROR',
        require('util').inspect(e, {depth: 3, colors: true}));
    }
    return result;
  }
};

exports.createOperation = async ({mode, hostname}) => {
  const veresDriver = await _getDriver({mode, hostname});
  const didDocument = await veresDriver.generate({});
  const client = veresDriver.client.ledger;
  const {doc} = didDocument;
  const operation = await client.wrap({record: doc});
  // FIXME: this is a mock accelerator proof that is only schema validated
  operation.proof = {
    type: 'Ed25519Signature2018',
    created: '2019-01-10T23:10:25Z',
    capability: 'did:v1:uuid:c37e914a-1e2a-4d59-9668-ee93458fd19a',
    capabilityAction: 'write',
    jws: 'MOCKPROOF',
    proofPurpose: 'capabilityInvocation',
    verificationMethod: 'did:v1:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBb' +
      'P8T2CezuFY#z279tKmToKKMjQ8tsCgTbBBthw5xEzHWL6GCqZyQnzZr7wUo'
  };
  // get private key
  const invokeKeyNode = didDocument.getVerificationMethod({
    proofPurpose: 'capabilityInvocation'
  });
  const capabilityInvocationKey = didDocument.keys[invokeKeyNode.id];
  const signedOperation = await jsigs.sign(operation, {
    compactProof: false,
    documentLoader: v1.documentLoader,
    suite: new Ed25519Signature2018({key: capabilityInvocationKey}),
    purpose: new CapabilityInvocation({
      capability: didDocument.id,
      capabilityAction: 'create'
    })
  });

  return {client, operation: signedOperation};
};
