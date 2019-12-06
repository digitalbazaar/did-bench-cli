/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const _ledgerClient = require('./ledger-client');
const _operationGeneratorClient = require('./operation-generator-client');

exports.startOperations = async ({hostnames, operationsPerSecond}) => {
  console.log('Attempting to collect target details.', {hostnames});
  let targets;
  try {
    targets = await _ledgerClient.getEndpoints({hostnames});
  } catch(e) {
    console.error('Failed to collect target details.', {errorName: e.name});
    throw e;
  }
  targets.forEach(t => {
    t.operationsPerSecond = operationsPerSecond;
  });
  console.log('Successfully collected target details', {targets});
  try {
    await _operationGeneratorClient.start({targets});
  } catch(e) {
    console.error('Failed to send targets to operation generator.', {error: e});
    throw e;
  }
};
