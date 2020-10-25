/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const assert = require('assert-plus');
const delay = require('delay');
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
  const totalJobStats = {
    total: 0,
    ok: 0,
    error: 0,
    NetworkError: 0,
    ECONNRESET: 0
  };
  const totalTimer = _timer();

  while(true) {
    // generate and send operations
    const timer = _timer();
    const jobStats = await _jobProcess.sendOperations({targets});
    const elapsedTime = timer.elapsed();
    const totalTime = totalTimer.elapsed();
    const remainingTime = 1000.0 - elapsedTime;
    await delay(remainingTime);

    // calculate the average number of operations per second
    let sample = totalOps;
    if(elapsedTime > 1000.0) {
      sample = totalOps / (elapsedTime / 1000);
    }
    samples.push(sample);
    samples = samples.splice(-10, 10);
    const opsPerSecond = samples.reduce((total, value) => {
      return total + value;
    }, 0) / samples.length;

    // sum up job stats
    totalJobStats.total += jobStats.total;
    totalJobStats.ok += jobStats.ok;
    totalJobStats.error += jobStats.error;
    totalJobStats.NetworkError += jobStats.NetworkError;
    totalJobStats.ECONNRESET += jobStats.ECONNRESET;

    const totalLatency = jobStats.data.reduce((total, value) => {
      return total + value.monitor.duration;
    }, 0);
    const averageLatency = totalLatency / jobStats.data.length;

    // display the test status
    const jStats = {...jobStats};
    delete jStats.data;
    console.clear();
    console.log('did-bench -', new Date());
    console.log('Avg. Latency:', `${averageLatency}ms`);
    console.log('Ops/sec:', opsPerSecond.toFixed());
    console.log('Ops (last):',
      `${(jobStats.total / elapsedTime * 1000).toFixed(3)}/s`,
      `${(elapsedTime / 1000).toFixed(3)}s`,
      jStats);
    console.log('Ops (total):',
      `${(totalJobStats.total / totalTime * 1000).toFixed(3)}/s`,
      `${(totalTime / 1000).toFixed(3)}s`,
      totalJobStats);
    console.log();
    console.log('HOST'.padEnd(30), 'OPS'.padEnd(4));
    for(const target of targets) {
      console.log(target.hostname.padEnd(30),
        target.operationsPerSecond.toString().padEnd(4));
    }
  }
};
