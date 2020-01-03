/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const _operationGeneratorClient = require('./operation-generator-client');

exports.startOperations = async ({
  mode, hostnames, operationsPerSecond, monitor
}) => {
  //console.log('Attempting to collect target details.', {hostnames});
  const hostOpsPerSec = Math.floor(operationsPerSecond / hostnames.length);
  const targets = hostnames.map(hostname => ({
    mode,
    hostname,
    operationsPerSecond: hostOpsPerSec
  }));
  //console.log('Successfully collected target details', {targets});
  try {
    await _operationGeneratorClient.start({targets, monitor});
  } catch(e) {
    console.error('Failed to send targets to operation generator.', {error: e});
    throw e;
  }
};
