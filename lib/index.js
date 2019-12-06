/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const _ = require('lodash');
const _operationGeneratorClient = require('./operation-generator-client');

exports.startOperations = async ({hostnames, operationsPerSecond}) => {
  console.log('Attempting to collect target details.', {hostnames});
  const targets = _.cloneDeep(hostnames);
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
