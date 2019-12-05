# did-bench-cli

A command-line client for bench testing Decentralized Identifier Networks.

 * [Quickstart](#quickstart)
 * [Installation](#installation)
 * [Support](#support)

## Quickstart

The current client supports bench testing the creation of many DIDs for Veres
One. You can try the tool out by doing the following commands on a system that
has node.js and a C++ compiler installed:

    npm install did-bench-cli
    cd node_modules/did-bench-cli
    ./did-bench

## Installation

### Requirements

* Linux
  * g++ to build native binaries
* Mac OS X
  * X Code 9 to build native binaries
* Node.js >= 12.13.x
* npm >= 6.x

### Install

Install in a development directory:

    npm install did-bench-cli
    ./node_modules/.bin/did-bench ...

Install globally:

    npm install -g did-bench-cli
    did-bench ...

### Developing

To download the source and install the client:

    git clone https://github.com/digitalbazaar/did-bench-cli.git
    cd did-bench-cli
    npm install
    ./did-bench ...

## Support

Bugs, suggestions, requests, and code issues:

  * https://github.com/digitalbazaar/did-bench-cli/issues

Commercial support is available upon request from [Digital Bazaar][]:

  * support@digitalbazaar.com

[Digital Bazaar]: https://digitalbazaar.com/
