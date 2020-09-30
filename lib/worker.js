/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const operationGenerator = require('./operation-generator');

// a simple worker for use in node.js (as a child process)

// load workerpool
const workerpool = require('workerpool');

// create a worker and register public functions
workerpool.worker({
  sendOperations: operationGenerator.sendOperations
});
