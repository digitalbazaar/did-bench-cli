/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const assert = require('assert-plus');
// const delay = require('delay');
const _jobProcess = require('./job-process');
const _statsClient = require('./stats-client');
const _timer = require('./timer');

exports.start = async ({targets, monitor}) => {
  assert.array(targets, 'options.targets');
  if(monitor) {
    const monitorInterval = 10000;
    const hostnames = targets.map(t => t.hostname);
    setInterval(async () => {
      const reports = await _statsClient.collectReports({hostnames});
      const stats = [];
      for(const nodeReports of reports) {
        // get the last report
        const nodeReport = nodeReports[nodeReports.length - 1];
        // iterate the monitorIds in the report
        for(const monitor in nodeReport.monitors) {
          if(monitor.startsWith('ledgerNode')) {
            stats.push(nodeReport.monitors[monitor]);
            /* cherry pick properties
            const {continuity: {
              localOpsListLength,
              latestSummary: {
                eventBlock: {block: {blockHeight}}
              }
            }} = nodeReport.monitors[monitor];
            stats.push({blockHeight, localOpsListLength});
            */
          }
        }
      }
      for(let i = 0; i < hostnames.length; ++i) {
        console.log('=================================');
        console.log(`Stats for ${hostnames[i]}`);
        console.log(JSON.stringify(stats[i], null, 2));
      }
    }, monitorInterval);
  }

  const totalOps = targets.reduce((total, target) => {
    return (total + target.operationsPerSecond);
  }, 0);
  let samples = new Array();
  while(true) {
    // FIXME: RETURN THIS TO BEING MORE OF AN INTERVAL
    const timer = _timer();
    await _jobProcess.sendOperations({targets});
    // await delay(1000);

    // calculate the average number of operations per second
    const sample = totalOps / (timer.elapsed() / 1000);
    samples.push(sample);
    samples = samples.splice(-10, 10);
    const opsPerSecond = samples.reduce((total, value) => {
      return total + value;
    }, 0) / samples.length;

    // display the output
    console.clear();
    console.log('did-bench -', new Date());
    console.log('Ops/sec:', opsPerSecond.toFixed(0), '\n');
    console.log('HOST'.padEnd(30), 'OPS'.padEnd(4));
    for(const target of targets) {
      console.log(target.hostname.padEnd(30),
        target.operationsPerSecond.toString().padEnd(4));
    }
  }
};
