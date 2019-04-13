//main program
console.log("[*] Blockchain-standard node start! ");
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as _ from 'lodash';
import {
    Block, getHostAccountBalance, getBlockchain, getMyUnspentTransactionOutputs,
    getUnspentTxOuts, getAccountBalance,validateIdentifier} from './blockchain';
//identifier log over following command
import {connectToPeers, getSockets, initP2PServer, removeConnection} from './p2p';

import {UnspentTxOut} from './transaction';
import {getTransactionPool} from './transactionPool';
import {getPublicFromWallet, initWallet} from './wallet';
import {initDiscoveryServer,sendHello,EthProcessServer} from './protocol';
import {initInServer,initOutServer} from './communication';

const config = require('config');
//const p2pPort: number = parseInt(process.env.P2P_PORT) || config.get('Server.P2P_PORT');
//const discoveryPort: number = parseInt(process.env.DISCOVERY_PORT) || config.get('Server.DISCOVERY_PORT');

const p2pPort: number = config.get('Server.P2P_PORT');
const discoveryPort: number = config.get('Server.DISCOVERY_PORT');
const inPort: number = config.get('Server.IN_PORT');
const outPort: number = config.get('Server.OUT_PORT');
var shell = require('shelljs');
var directory = shell.pwd().toString();
initP2PServer(p2pPort); //call by p2p.ts
initDiscoveryServer(discoveryPort); // call by protocol
initInServer(inPort); //firewall, call by communication
initOutServer(outPort); //firewall, call by communication
EthProcessServer(9999);
//EthAESAuthServer(9998);
process.stdin.resume();

process.on('SIGINT', function () {
  console.log('Good Bye!!');
  shell.exec(directory+'/ShellCall/enableARP.sh');
  shell.exec(directory+'/ShellCall/IPenable.sh');
  shell.exec(directory+'/ShellCall/Reset.sh');
  shell.exec(directory+'/ShellCall/firewalloff.sh');
  process.exit();
});
