/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {httpClient} = require('@digitalbazaar/http-client');
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
  const api = {
    async get(path) {
      try {
        const response = await httpClient.get(`${baseURL}${path}`, {
          headers: {accept: 'application/json'},
          agent: new https.Agent({rejectUnauthorized: strictSSL}),
          timeout: 60000
        });
        return response;
      } catch(e) {
        const {response} = e;
        if(response) {
          const error = new Error((path === '/monitors') ?
            'Error getting monitor IDs.' : 'Error getting reports.');
          // CLIENT_ERRORs often have data
          if(response.status >= 400 && response.status < 500) {
            error.details = {
              baseURL, error: e.data || response.data, status: response.status
            };
          } else {
            error.details = {
              // originalError is an axios error which spams the logs
              // baseURL, error: response.originalError, status: response.status
              baseURL, status: response.status
            };
          }
          console.log(JSON.stringify(error, null, 2));
          logger.error('Error', {error});
          throw error;
        }
      }
    }
  };
  // get all available stats monitor IDs
  logger.debug('Attempting to get stats.', {baseURL});
  let response = await api.get('/monitors');
  console.log('zzzzzzzzzzzzzzzzz', response.data);
  const {data: monitorIds} = response;
  response = await api.get('/', {monitorIds});
  return response.data;
};

exports.collectReports = async ({hostnames, params}) => Promise.all(
  hostnames.map(hostname => exports.get({hostname, params})));
