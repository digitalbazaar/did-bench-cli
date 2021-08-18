/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const workerpool = require('workerpool');
const path = require('path');

module.exports = workerpool.pool(path.join(__dirname, 'worker.js'), {
  minWorkers: 'max',
  maxWorkers: workerpool.cpus
});
