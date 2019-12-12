/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const v1 = require('did-veres-one');
const https = require('https');
const jsigs = require('jsonld-signatures');
const pTimes = require('p-times');
const {
  suites: {Ed25519Signature2018}
} = jsigs;
const {CapabilityInvocation} = require('ocapld');

const MAX_CONCURRENCY = 250;

const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
});

const _logger = new Proxy({}, {
  get() {
    return () => {};
  }
});

// a simple worker for use in node.js (as a child process)

// load workerpool
const workerpool = require('workerpool');

const _cache = new Map();

async function _getDriver({hostname}) {
  let veresDriver = _cache.get(hostname);
  if(veresDriver) {
    return veresDriver;
  }
  const options = {mode: 'test', httpsAgent, hostname, logger: _logger};
  veresDriver = v1.driver(options);
  // this initializes the driver by getting leger agent status
  await veresDriver.client.ledger.getAgent();
  _cache.set(hostname, veresDriver);
  return veresDriver;
}

async function sendOperations({hostname, operationsPerSecond}) {
  try {
    const veresDriver = await _getDriver({hostname});
    const options = {concurrency: MAX_CONCURRENCY};
    await pTimes(operationsPerSecond, () =>
      sendOperation({veresDriver}), options);
  } catch(e) {
    console.error(e);
  }
}

async function sendOperation({veresDriver}) {
  try {
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
    await client.sendOperation({operation: signedOperation});
  } catch(e) {
    console.error('ERROR', e);
  }
}

// create a worker and register public functions
workerpool.worker({sendOperations});
