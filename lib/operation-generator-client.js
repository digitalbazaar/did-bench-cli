/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const assert = require('assert-plus');
// const delay = require('delay');
const _jobProcess = require('./job-process');
const _timer = require('./timer');

exports.start = async ({targets}) => {
  assert.array(targets, 'options.targets');
  while(true) {
    // console.log('======== START ========');
    // FIXME: RETURN THIS TO BEING MORE OF AN INTERVAL
    const timer = _timer();
    await _jobProcess.sendOperations({targets});
    // await delay(1000);
    console.log('======== END ======== Duration (ms)', timer.elapsed());
  }
};
