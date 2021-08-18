/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {WebLedgerClient} = require('web-ledger-client');
const https = require('https');

exports.getEndpoints = async ({hostnames}) => {
  const promises = hostnames.map(hostname => {
    const httpsAgent = new https.Agent({rejectUnauthorized: false});
    const client = new WebLedgerClient({hostname: `${hostname}`, httpsAgent});

    return (async () => {
      // there is no benefit in running these in parallel
      const endpoint = await client.getServiceEndpoint(
        {serviceId: 'ledgerOperationService'});
      const targetNode = await client.getTargetNode();
      return {endpoint, targetNode};
    })();
  });
  return Promise.all(promises);
};
