import * as dgram from 'dgram';
import * as CryptoJS from 'crypto-js';
import * as ip from 'ip';
import {getChainKeyFromChain,getLatestBlock,getPublicFromWallet,getChainLength,
  validateIdentifier,checkReadyStatus} from './blockchain';
import {getSockets,connectToPeers,JSONToObject,getAliveConn} from './p2p';
var util = require('util');
var flag = false;
var lock = false;
var chance = 10;
var shell = require('shelljs');
const config = require('config');
var directory = shell.pwd().toString();
var AuthDevice = [];

enum MessageType {
    HELLO = 0,
    AUTH_RESPONSE = 1,
    ETH_HELLO = 2,
    ETH_AUTH = 3
}

const setFlag = (setvalue: boolean) => {
  flag = setvalue;
  lock = setvalue;
}

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

class Message {
    public type: MessageType;
    public data: string;

    constructor(type: MessageType, data: string) {
      this.type = type;
      this.data = data;
    }
}

const sendHello = (message: string, send_ip: string) =>{
  const socket = dgram.createSocket("udp4");
  socket.bind(function () {
    socket.setBroadcast(true);
  });
    const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString();
    //console.log('// DEBUG: my hash: ' + chainHash);
    console.log(message);
    socket.send(message, 0, message.length, 9998, send_ip, function(err, bytes) {
      socket.close();
    });
  }

  const sendEthernetHello = () =>{
    const socket = dgram.createSocket("udp4");
    socket.bind(function () {
      socket.setBroadcast(true);
    });
    if (checkReadyStatus()){
      const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString();
      //console.log('// DEBUG: my hash: ' + chainHash);
      //const message = new Buffer(JSON.stringify(new Message(MessageType.ETH_HELLO,chainHash)));
      var send_message = util.format("|+|%s|+|%d|+|",chainHash,0);
      console.log(send_message);
      let {PythonShell} = require('python-shell');
      let pyshell = new PythonShell(directory+'/Raw_Send.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'], args:[send_message]});
      //pyshell.pythonPath = 'usr/bin';
      pyshell.on('message', function (message){
        //console.log("Python Debug: "+message);
        //var command = directory+'/ShellCall/acceptmac.sh '+rece_mac;
            });
      pyshell.end(function(err,code,signal){
        if (err) throw err;
          });
        }
      }
      /*
      const ReceiveEthernet = () =>{
        const socket = dgram.createSocket("udp4");
        socket.bind(function () {
          socket.setBroadcast(true);
        });
        if (checkReadyStatus()){
          const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString()+":"+getChainKeyFromChain();
          //console.log('// DEBUG: my hash: ' + chainHash);
          const message = new Buffer(JSON.stringify(new Message(MessageType.ETH_HELLO,chainHash)));
          let {PythonShell} = require('python-shell');
          let pyshell = new PythonShell(directory+'/RecvETH.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'] });
          //pyshell.pythonPath = 'usr/bin';
          pyshell.stdin.write(message);
          pyshell.on('message', function (message){
            console.log("Python Debug: "+message);
            if(message.indexOf("<+>")!=-1){
              //console.log("Auth!!!!");
              var rece_mac = message.split("|")[1];
              var command = directory+'/ShellCall/acceptmac.sh '+rece_mac;
              console.log("NodeJS debug: "+command);
              shell.exec(command);
              lock=true;
              //sendHello();
            }
                });
          pyshell.end(function(err,code,signal){
            if (err) throw err;
              });
            }
          }

      const sendEthernetAESAuth = () =>{
        const socket = dgram.createSocket("udp4");
        socket.bind(function () {
          socket.setBroadcast(true);
        });
        if (checkReadyStatus()){
          const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString()+":"+getChainKeyFromChain();
          //console.log('// DEBUG: my hash: ' + chainHash);
          var cipherIdentifier = CryptoJS.AES.encrypt(getPublicFromWallet(), getChainKeyFromChain()).toString();
          cipherIdentifier = cipherIdentifier+":"+getChainKeyFromChain();
          const message = new Buffer(JSON.stringify(new Message(MessageType.ETH_AUTH,cipherIdentifier)));
          let {PythonShell} = require('python-shell');
          let pyshell = new PythonShell(directory+'/SendETH.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'] });
          //pyshell.pythonPath = 'usr/bin';
          pyshell.stdin.write(message);
          pyshell.on('message', function (message){
            console.log("Python Debug: "+message);
            if(message=="Goal!!"){
              console.log("NodeJS Receive: "+message);
              //lock=true;
              //authETH = true;
              //sendHello();
              }
            });
          pyshell.end(function(err,code,signal){
            if (err) throw err;
              });
            }
          }
          */


const EthProcessServer = (discoveryPort: number) => {
  const ethserver = dgram.createSocket("udp4");
  ethserver.bind(discoveryPort);
  ethserver.on("listening", function(){
    var address = ethserver.address();
    console.log("Using for ethernet only");
    setInterval(function(){
      if (checkReadyStatus()){
          //sendHello();

        if(!flag){
          console.log(`[^] Sending ETHERNET HELLO to discover other peers`);
          sendEthernetHello();
        }

      }
    },1000);
  });
  EthernetMessageHandler(ethserver);
}

function hex_to_ascii(str1)
 {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 }

const EthernetMessageHandler = (server : dgram.Socket) => {
  server.on("message", function (msg, rinfo) {
    if (rinfo.address != ip.address()){
      console.log("Ethernet got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
        try {
              let {PythonShell} = require('python-shell');
              var receive_msg = msg.toString();
              //const message: Message = JSONToObject<Message>(hex_to_ascii(msg));

              //const message: Message = JSONToObject<Message>(hex_to_ascii(hex_to_ascii(msg).toString()));
              if(receive_msg.indexOf("|+|")==-1)throw new Error('[!] Not the valid Message');
              var type = parseInt(receive_msg.split("|+|")[2],10);
              var message = receive_msg.split("|+|")[1];
              var src_mac = receive_msg.split("|+|")[4];
              var ip_addr = receive_msg.split("|+|")[5];
              console.log("Ethernet got: " + message + " from " + src_mac);
              if (message === null) {
                  console.log('[!] Could not parse received JSON message: ' + msg.toString());
                  return;
              }
              switch (type){
              case MessageType.HELLO:
              console.log("Receive The Hello Message ETH!");
              const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString();
              if(message==chainHash){
                console.log("Right person!!");
                var cipherIdentifier = CryptoJS.AES.encrypt(getPublicFromWallet()+"<+>"+ip_addr, getChainKeyFromChain()).toString();
                console.log(cipherIdentifier);
                var send_message = util.format("|+|%s|+|%d|+|",cipherIdentifier,1);
                console.log("Wanna send :"+send_message);
                //console.log("IP address :"+ip_addr);

                let pyshell = new PythonShell(directory+'/Raw_Send.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'], args:[send_message,src_mac]});
                pyshell.on('message', function (message){
                  //console.log("Python Debug: "+message);
                  });
              }else{
                console.log("Correct Hash = "+chainHash);
              }
                break;
              case MessageType.AUTH_RESPONSE:
              console.log("Receive The Auth Message ETH!");
              console.log(message);
              var bytes  = CryptoJS.AES.decrypt(message, getChainKeyFromChain());
              var identifier = bytes.toString(CryptoJS.enc.Utf8).split("<+>")[0];
              var sender_IP = bytes.toString(CryptoJS.enc.Utf8).split("<+>")[1];
              console.log("Decrypted result: "+identifier);
              console.log("Decrypted IP address: "+sender_IP);
              var command = util.format("%s//ShellCall/acceptmac.sh %s %s",directory,src_mac,sender_IP);
              AuthDevice.push({
                IP_address: sender_IP,
                Mac_address: src_mac
              });
              console.log(command);
              shell.exec(command);
              let pyshell = new PythonShell(directory+'/InterfaceBoardcast.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'],});
              pyshell.on('message', function (message){
                //console.log("Python Debug: "+message);
                var interface_msg = message;
                //console.log(CryptoJS.AES.encrypt(interface_msg, getChainKeyFromChain()).toString());
                sendHello(CryptoJS.AES.encrypt(interface_msg, getChainKeyFromChain()).toString(),sender_IP);
                });
              if (validateIdentifier(identifier)){
                console.log("Open the Gate!!!");
                const socketList = getSockets().map((s: any) => s._socket.remoteAddress).map(String);
                //if(!socketList.includes(sender_IP)){
                console.log("// DEBUG: trying to connect with :" + sender_IP + ':' + config.get('Server.P2P_PORT'));
                connectToPeers('ws://' + sender_IP + ':' + config.get('Server.P2P_PORT'), getChainKeyFromChain());
                console.log("After connectToPeers");
                //}

              }
              break;
        }

          } catch (e) {
            console.log('[!]',e);
          }
  }
  });
};


const EthBoardcastServer = (discoveryPort: number) => {
  const ethserver = dgram.createSocket("udp4");
  ethserver.bind(discoveryPort);
  ethserver.on("listening", function(){
    var address = ethserver.address();
  });
  initBoardcastHandler(ethserver);
}

const initBoardcastHandler = (server : dgram.Socket) => {
  server.on("message", function (msg, rinfo) {
    if (rinfo.address != ip.address()){
      console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);

      try {
        var rece_msg = msg.toString();
        //console.log(rece_msg);
        var interface_msg = "";
        var bytes  = CryptoJS.AES.decrypt(rece_msg, getChainKeyFromChain());
        var decryptMessage = bytes.toString(CryptoJS.enc.Utf8);
        if(decryptMessage.indexOf("<+>")!=-1 && decryptMessage.indexOf("|+|")!=-1){
          var receIntArr = decryptMessage.split("|+|");
          for(var i=0;i<receIntArr.length;i++){
            //console.log(receIntArr[i]);

            if(receIntArr[i].split("<+>").length==2){
              var cur_ip = receIntArr[i].split("<+>")[1];
              var cur_mac = receIntArr[i].split("<+>")[0];
              console.log("Got the IP : "+cur_ip+" The reference mac address: "+cur_mac);

              var arrFound = AuthDevice.filter(function(item) {
                  return item.IP_address == cur_ip;
              });
              console.log("The finding result: "+arrFound.length);
              if(arrFound.length==0){
                AuthDevice.push({
                  IP_address: cur_ip,
                  Mac_address: cur_mac
                });
                var command = util.format("%s//ShellCall/acceptmac.sh %s %s",directory,cur_mac,cur_ip);
                console.log(command);
                shell.exec(command);
              }
              console.log(AuthDevice);
            }
          }
        }else{
          console.log("[!] That's not the correct boardcasting message, or decryption failure!");
        }
        /*
        let {PythonShell} = require('python-shell');
        let pyshell = new PythonShell(directory+'/InterfaceBoardcast.py',{ pythonPath: '/usr/bin/python',pythonOptions: ['-u'],});

        pyshell.on('message', function (message){
          //console.log("Python Debug: "+message);
          interface_msg = message;
          //console.log(CryptoJS.AES.encrypt(interface_msg, getChainKeyFromChain()).toString());

          });
          */
  } catch (e) {
      console.log('[!]',e);
  }
  }
  });
};


const senderlock = () => {
  flag = true;
  lock = false;
  var command = directory+'/ShellCall/IPenable.sh';
  console.log("NodeJS debug: "+command);
  //shell.exec(command);
  //shell.exec(directory+'/ShellCall/firewallon.sh');
}


/*
const initDiscoveryServer =(discoveryPort: number) => {
  const server = dgram.createSocket("udp4");
  server.bind(discoveryPort);
  server.on("listening", function () {
    var address = server.address();
    console.log(`[^] Discovery server listening ${address['address']}:${address['port']}`);
    shell.exec('node --version');
    setInterval(function(){
      const socketList = getSockets().map((s: any) => s._socket.remoteAddress);
      if (checkReadyStatus() && socketList.length < 1){
          //console.log(`[^] Sending HELLO to discover other peers`);
          //sendHello();
          //I DO NOTHING :)
        }
    },1000);
    initMessageHandler(server);
  });
}
//Receiver....UDP
const initMessageHandler = (server : dgram.Socket) => {
  server.on("message", function (msg, rinfo) {
    if (rinfo.address != ip.address()){
      console.log("server got: " + msg + " from " +
        rinfo.address + ":" + rinfo.port);
      try {
            const message: Message = JSONToObject<Message>(msg.toString());
            if (message === null) {
                console.log('[!] Could not parse received JSON message: ' + msg.toString());
                return;
            }
            switch (message.type){
            case MessageType.HELLO:
              console.log("[@] Protocol: Hello Message from :" + rinfo.address);
              const chainHash = CryptoJS.SHA256(getChainKeyFromChain()).toString();
              if(message.data == chainHash){
                lock = true;
                console.log("[@] Protocol: stage 1 - hash authentication success! ");
                var socket = dgram.createSocket("udp4");
                var cipherIdentifier = CryptoJS.AES.encrypt(getPublicFromWallet(), getChainKeyFromChain()).toString();
                const message = new Buffer(JSON.stringify(new Message(MessageType.AUTH_RESPONSE,cipherIdentifier)));
                socket.send(message, 0, message.length, 6002, rinfo.address, function(err, bytes) {
                  socket.close();
                });
              }
              break;
            case MessageType.AUTH_RESPONSE:
            //TCP connection (Completed the UDP)
              //console.log("// DEBUG: server got: " + MessageType.AUTH_RESPONSE);
              var bytes  = CryptoJS.AES.decrypt(message.data.toString(), getChainKeyFromChain());
              var identifier = bytes.toString(CryptoJS.enc.Utf8);
              if (validateIdentifier(identifier)){
                const socketList = getSockets().map((s: any) => s._socket.remoteAddress).map(String);
                if(!socketList.includes(rinfo.address)){
                  console.log("// DEBUG: trying to connect with :" + rinfo.address + ':' + config.get('Server.P2P_PORT'));
                  connectToPeers('ws://' + rinfo.address + ':' + config.get('Server.P2P_PORT'), getChainKeyFromChain());
                  console.log("After connectToPeers");
                }
              }
            break;
      }
  } catch (e) {
      console.log('[!]',e);
  }
  }
  });
};
*/
export {EthBoardcastServer,EthProcessServer,setFlag,senderlock};
