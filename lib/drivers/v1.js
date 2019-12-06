/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const didv1 = require('did-veres-one');

exports.generate = async ({hostname, mode}) => {
  // called to check hostname set properly
  const v1 = didv1.veres({
    hostname,
    mode
  });

  return v1.generate({});
};
