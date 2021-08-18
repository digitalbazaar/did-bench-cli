/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const _ = require('lodash');
const pool = require('./pool');

exports.sendOperations = async ({targets}) => {
  const {totalWorkers} = pool.stats();
  const tPromises = [];
  for(const target of targets) {
    for(let i = 0; i < totalWorkers; ++i) {
      const t = _.cloneDeep(target);
      t.operationCount =
        Math.floor(target.operationsPerSecond / totalWorkers);
      if(t.operationCount > 0) {
        tPromises.push(
          pool.exec('sendOperations', [t]).catch(err => console.error(err)));
      }
    }
    // the formulation above effectively rounds down, deal with the remainder
    const remainder = target.operationsPerSecond % totalWorkers;
    if(remainder) {
      const t = _.cloneDeep(target);
      t.operationCount = remainder;
      tPromises.push(
        pool
          .exec('sendOperations', [t])
          .catch(err => console.error('pool sendOperations error', err)));
    }
  }
  const results = await Promise.all(tPromises);
  const result = {
    total: 0,
    ok: 0,
    error: 0,
    NetworkError: 0,
    ECONNRESET: 0,
    data: []
  };
  for(const r of results) {
    result.total += r.total;
    result.ok += r.ok;
    result.error += r.error;
    result.NetworkError += r.NetworkError;
    result.ECONNRESET += r.ECONNRESET;
    result.data = [...result.data, ...r.data];
  }
  return result;
};

process.on('beforeExit', () => {
  pool.terminate(true);
});
