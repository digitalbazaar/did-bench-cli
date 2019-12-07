/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {create} = require('apisauce');
const https = require('https');
const logger = new Proxy({}, {
  get() {
    return () => {};
  }
});

exports.get = async ({hostname, strictSSL = false}) => {
  // assert.object(params, 'options.params');
  // assert.array(params.monitorIds, 'options.params.monitorIds');

  // FIXME: port should be configurable
  const baseURL = `https://${hostname}/stats/storage/redis`;
  const api = create({
    baseURL,
    httpsAgent: new https.Agent({rejectUnauthorized: strictSSL}),
    timeout: 60000,
  });
  // get all available stats monitor IDs
  logger.debug('Attempting to get stats.', {baseURL});
  let response = await api.get('/monitors');
  if(response.problem) {
    const {problem} = response;
    const error = new Error('Error getting monitor IDs.');
    if(problem === 'CLIENT_ERROR') {
      error.details = {
        baseURL, error: response.data, problem, status: response.status
      };
    } else {
      error.details = {
        // originalError is an axios error which spams the logs
        // baseURL, error: response.originalError, status: response.status
        baseURL, problem, status: response.status
      };
    }
    logger.error('Error', {error});
    throw error;
  }
  console.log('zzzzzzzzzzzzzzzzz', response.data);
  const {data: monitorIds} = response;
  response = await api.get('/', {monitorIds});
  if(response.problem) {
    const {problem} = response;
    const error = new Error('Error getting reports.');
    if(response.problem === 'CLIENT_ERROR') {
      error.details = {
        baseURL, error: response.data, problem, status: response.status
      };
    } else {
      error.details = {
        // originalError is an axios error which spams the logs
        // baseURL, error: response.originalError, status: response.status
        baseURL, error: problem, status: response.status
      };
    }
    console.log(JSON.stringify(error, null, 2));
    logger.error('Error', {error});
    throw error;
  }
  return response.data;
};

exports.collectReports = async ({hostnames, params}) => Promise.all(
  hostnames.map(hostname => exports.get({hostname, params})));
