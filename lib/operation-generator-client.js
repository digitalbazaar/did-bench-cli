/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const assert = require('assert-plus');
const delay = require('delay');
const _jobProcess = require('./job-process');

exports.start = async ({targets}) => {
  assert.array(targets, 'options.targets');
  while(true) {
    _jobProcess.sendOperations({targets});
    await delay(1000);
  }
};
