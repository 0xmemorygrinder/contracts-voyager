# Contracts Voyager

This extension allows to navigates verified smart-contracts sources files on multiple blockchains and check variable values on the fly.

![Demo](https://raw.githubusercontent.com/0xmemorygrinder/contracts-voyager/master/assets/demo.gif)

## Features

Load all the sources of a deployed smart-contract on major chains : 
- Ethereum
- Arbitrum (comming soon)
- Optimism (comming soon)
- ...

Display the native types properties values directly next to their definition

## Extension Settings

The settings include the RPC url to use for each chain. They are set by default to public access RPC but it might experiences rate-limiting while loading properties values.

Here is an example of the settings :

* `contracts-voyager.ethereumRpc`: defaults to `https://cloudflare-eth.com`


## Release Notes

### 0.1.2

Fixed annimation in readme

### 0.1.1

Added link to open addresses in variable decorations

### 0.1.0

Initial release of Contracts Voyager