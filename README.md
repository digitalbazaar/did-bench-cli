# did-bench-cli

A command-line client for bench testing Decentralized Identifier Networks.

 * [Quickstart](#quickstart)
 * [Installation](#installation)
 * [Usage](#usage)
 * [Support](#support)

## Quickstart

The current client supports bench testing the creation of many DIDs for Veres
One. You can try the tool out by doing the following commands on a system that
has node.js and a C++ compiler installed:

    npm install did-bench-cli
    cd node_modules/did-bench-cli
    ./did-bench -o 250 host1.example.com

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

## Usage

### General

The `did-bench` command has a minimal API.  Help is available with the
`--help/-h` command line option:

    did-bench -h

Send 100 operations per second to `host1.example.com`:

    did-bench -o 100 host1.example.com

Send 5 operations per second to `host1.example.com` & `host2.example.com:10443`:

    did-bench -o 5 host1.example.com host2.example.com:10443


## Support

Bugs, suggestions, requests, and code issues:

  * https://github.com/digitalbazaar/did-bench-cli/issues

Commercial support is available upon request from [Digital Bazaar][]:

  * support@digitalbazaar.com

[Digital Bazaar]: https://digitalbazaar.com/
