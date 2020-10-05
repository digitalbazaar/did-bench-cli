/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const pAll = require('p-all');
const pSettle = require('p-settle');
const reInterval = require('reinterval');
const opGenerator = require('did-bench-cli/lib/operation-generator');
const hdr = require('hdr-histogram-js');
const histPercentileObj = require('hdr-histogram-percentiles-obj');

const {histAsObj, addPercentiles} = histPercentileObj;
const {createOperation, sendOperation} = opGenerator;

const REQUEST_TARGET_SAMPLE_RATE_MS = 1000;
const REQUEST_SAMPLE_RATE_MS = 50;
let requestCounter = 0;

module.exports = async (event, context) => {
  const result = await didBench(event.body);
  return context
    .status(200)
    .headers({'Content-Type': 'application/json'})
    .succeed(JSON.stringify(result));
};

async function didBench({
  mode = 'test',
  operationCount = 4,
  concurrency = 4,
  hostname,
  duration = 10
} = {}) {
  const latencyStats = new Array();
  let requestStats = new Array();
  const start = Date.now();
  const end = start + (duration * 1000);

  function tickInterval() {
    requestStats.push(requestCounter);
    requestCounter = 0;
  }

  while(Date.now() < end) {
    const ops = await generateOperations({mode, hostname, operationCount});
    const interval = reInterval(tickInterval, REQUEST_SAMPLE_RATE_MS);
    const stats = await sendOperations({operations: ops, concurrency, end});
    interval.clear();
    latencyStats.push(...stats);
  }

  const finish = Date.now();

  requestStats = _downsample(
    requestStats,
    {target: REQUEST_TARGET_SAMPLE_RATE_MS, current: REQUEST_SAMPLE_RATE_MS}
  );

  const report = generateReport(
    latencyStats,
    requestStats,
    {hostname, operationCount, concurrency, start, finish}
  );
  return report;
}

async function generateOperations({mode, hostname, operationCount}) {
  const numOfOps = Array.from(Array(operationCount));
  const opts = {concurrency: 100};
  const actions = numOfOps.map(() => {
    return () => createOperation({mode, hostname});
  });
  return pAll(actions, opts);
}

async function sendOperations({operations, concurrency, end}) {
  const actions = operations.map(({client, operation}) => {
    return async () => {
      const p = sendOperation({client, operation});
      if(Date.now() >= end) {
        throw new Error('Time Expired');
      }
      try {
        const res = await p;
        ++requestCounter;
        return res;
      } catch(e) {
        throw e;
      }
    };
  });
  const results = await pSettle(actions, {concurrency});
  return results.filter(res => res.isFulfilled).map(({value}) => value);
}

function _downsample(data, {target, current}) {
  if(target <= current) {
    throw new Error('Target Sample Rate must be greater than the Current Rate');
  }
  if(target % current !== 0) {
    throw new Error('Current Sample Rate must be a divisor of the Target Rate');
  }

  const samples = new Array();
  const windowSize = target / current;

  for(let i = 0; i < data.length; i += windowSize) {
    const subset = data.slice(i, i + windowSize);
    if(subset.length === windowSize) {
      const sample = subset.reduce((total, val) => {
        return total + val;
      }, 0);
      samples.push(sample);
    }
  }

  return samples;
}

function generateReport(
  latencyStats,
  requestStats,
  {hostname, operationCount, concurrency, start, finish}) {
  const successfulRequests = latencyStats.filter(val => !!val.monitor);

  const latencies = hdr.build();
  for(const successfulRequest of successfulRequests) {
    const {duration} = successfulRequest.monitor;
    latencies.recordValue(duration);
  }
  const requests = hdr.build();
  for(const reqsPerSec of requestStats) {
    requests.recordValue(reqsPerSec);
  }

  const totalRequests = successfulRequests.length;
  const results = {
    hostname,
    requests: addPercentiles(requests, histAsObj(requests, totalRequests)),
    latency: addPercentiles(latencies, histAsObj(latencies)),
    operationCount,
    concurrency,
    start: new Date(start),
    finish: new Date(finish),
    duration: (finish - start) / 1000
  };
  latencies.destroy();
  requests.destroy();

  return results;
}

setImmediate(async () => {
  const opts = {hostname: 'localhost:45443', mode: 'dev'};
  const stuff = await didBench(opts);
  console.log(JSON.stringify(stuff));
});
