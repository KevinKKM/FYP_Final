/*
Proxy Server
Control the redirect traffic
usful function: initInServer,initOutServer, call by main.ts
*/
import * as CryptoJS from 'crypto-js';
import * as net from 'net';
import {getOriginalAddr} from './util';
import {getChainKeyFromChain,getPublicFromWallet,validateIdentifier,
  getChainLength,checkReadyStatus} from './blockchain';

const HOST = '127.0.0.1';

const initInServer =(IN_PORT: number) => {
  net.createServer(function(out_sock) {
    /*
     *        > Handle incoming traffic <
     *   - out_sock: out socket to other computer
     *   - local_sock: local socket to user program
     */
    var local_sock = new net.Socket();
    const orginialPort : number = parseInt(getOriginalAddr(out_sock)[1]);

    console.log('[in] CONNECTED: ' + out_sock.remoteAddress + ':' + out_sock.remotePort);

    local_sock.connect(orginialPort, HOST, function() {
      console.log('[in] REDIRECT to port: ' + orginialPort);
    });

    local_sock.on('data', function(data) {
    //console.log('[in] <- Local socket response ' + data.length + ' bytes.');
    //console.log(`-> local_sock response : `+ data);
    if (checkReadyStatus() && orginialPort!= 6001){
      //console.log('[in] Send encrypted Data' + data);
      out_sock.write(encryptPayload(data));
    }
    else{
      out_sock.write(data);
    }
    });

    local_sock.on('close', function(data) {
      console.log('[in] Local socket closed connection.');
      //out_sock.end();
    });

    local_sock.on('error', function(err) {
      console.log('[in] Local socket errored: ' + err.message);
    });

    out_sock.on('data', function(data) {
      //console.log(`[in] -> Received ${data.length} bytes...`);
      //console.log(`<- Received data : `+ data);
      if (checkReadyStatus() && orginialPort != 6001){
        var payload = decryptPayload(data);
        if (payload){
          local_sock.write(payload);
        }
        else{
          out_sock.end();
          local_sock.end();
        }
      }
      else{
        local_sock.write(data);
      }
    });

    out_sock.on('error', function(err) {
      console.log('[in] Socket errored: ' + err.message);
    });

    out_sock.on('close', function(data) {
      console.log('[in] Closing socket: ' + out_sock.remoteAddress + ':' + out_sock.remotePort);
      local_sock.end();
    });
  }).listen(IN_PORT);
  console.log('[*] Server for Incoming traffic listening on ' + HOST +':'+ IN_PORT);
}

const initOutServer =(OUT_PORT: number) => {
  net.createServer(function(local_sock) {
    /*
     *          > Handle outgoing traffic <
     *   - local_sock: Local socket to user program
     *   - out_sock: Out socket to other computer
     */

    var out_sock = new net.Socket();
    const orginialIP = getOriginalAddr(local_sock)[0];
    const orginialPort : number = parseInt(getOriginalAddr(local_sock)[1]);

    console.log('[out] CONNECTED: ' + local_sock.remoteAddress + ':' + local_sock.remotePort);


    out_sock.connect(orginialPort, orginialIP, function() {
      console.log('[out] REDIRECT To' + orginialIP + ":" + orginialPort);
    });

    local_sock.on('data', function(data) {
    //console.log('[out] <- Local socket send ' + data.length + ' bytes.');
    //console.log(`-> out_sock response : `+ data);
    if (checkReadyStatus() && orginialPort != 6001){
      out_sock.write(encryptPayload(data));
    }
    else{
      out_sock.write(data);
    }
    });

    out_sock.on('close', function(data) {
      console.log('[out] Local socket closed connection.');
      //out_sock.end();
    });

    out_sock.on('error', function(err) {
      console.log('[out] Local socket errored: ' + err.message);
    });

    out_sock.on('data', function(data) {
      //console.log(`[out] -> Received ${data.length} bytes...`);
      //console.log(`<- Received data : `+ data);
      if (checkReadyStatus() && orginialPort != 6001){
        var payload = decryptPayload(data);
        if (payload){
          local_sock.write(payload);
        }
        else{
          out_sock.end();
          local_sock.end();
        }
      }
      else{
        local_sock.write(data);
      }
    });

    local_sock.on('error', function(err) {
      console.log('[out] Socket errored: ' + err.message);
    });

    local_sock.on('close', function(data) {
      console.log('[out] Closing socket: ' + local_sock.remoteAddress + ':' + local_sock.remotePort);
      out_sock.end();
    });
  }).listen(OUT_PORT);
  console.log('[*] Server for Outgoing traffic listening on ' + HOST +':'+ OUT_PORT);
}

const encryptPayload =(payload) =>{
  if(payload){
    var header = CryptoJS.AES.encrypt(new Buffer(getPublicFromWallet()).toString('base64'), getChainKeyFromChain()).toString();
    var chiperPayload = CryptoJS.AES.encrypt(new Buffer(payload).toString('base64'), getPublicFromWallet()).toString();
    return (header + chiperPayload);
  }
  else{
    return payload;
  }
}

const decryptPayload =(payload) =>{
    if(payload){
      try {
        var dechiperIdentifier = CryptoJS.AES.decrypt(payload.slice(0,280).toString() , getChainKeyFromChain()).toString(CryptoJS.enc.Utf8);
        var decodedIdentifier = new Buffer(dechiperIdentifier, 'base64');
        if (validateIdentifier(decodedIdentifier.toString())){
          var dechiperPayload = CryptoJS.AES.decrypt(payload.slice(280).toString(), decodedIdentifier.toString()).toString(CryptoJS.enc.Utf8);
          var decodedPayload = new Buffer(dechiperPayload, 'base64');
          console.log('[Crypto] Decryption Success!!!');
          return (decodedPayload.toString());
        }
        else{
          console.log('[Crypto] Identifier missing or not authenticated');
        }
      }
      catch(error) {
        console.log('[Crypto] Decryption failure!!!');
      }
    }
    else{
      return payload;
    }
}

export { initInServer, initOutServer};
