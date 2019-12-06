/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
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
      t.operationsPerSecond =
        parseInt(target.operationsPerSecond / totalWorkers);
      tPromises.push(
        pool.exec('sendOperations', [t]).catch(err => console.error(err)));
    }
    // the formulation above effectively rounds down, deal with the remainder
    const remainder = target.operationsPerSecond % totalWorkers;
    if(remainder) {
      const t = _.cloneDeep(target);
      t.operationsPerSecond = remainder;
      tPromises.push(
        pool.exec('sendOperations', [t]).catch(err => console.error(err)));
    }
  }
  await Promise.all(tPromises);
};
