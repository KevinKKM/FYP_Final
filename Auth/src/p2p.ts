import * as WebSocket from 'ws';
import {Server} from 'ws';
import {
    addBlockToChain, Block, getBlockchain, getLatestBlock, handleReceivedTransaction, isValidBlockStructure,
    verifyChainKey, getAuthPool, addIdentifierToAuthPool
} from './blockchain';
import {Transaction} from './transaction';
import {getTransactionPool} from './transactionPool';

const sockets: WebSocket[] = [];

enum MessageType {
    QUERY_LATEST = 0,
    QUERY_ALL = 1,
    RESPONSE_BLOCKCHAIN = 2,
    QUERY_TRANSACTION_POOL = 3,
    RESPONSE_TRANSACTION_POOL = 4,
    CHAIN_KEY_VERIFY = 5,
    AUTHENTICATION_REQUEST = 6
}

class Message {
    public type: MessageType;
    public data: any;
}

const initP2PServer = (p2pPort: number) => {
    const server: Server = new WebSocket.Server({port: p2pPort});
    server.on('connection', (ws: WebSocket) => {
        initConnection(ws);
    });
    console.log('[*] Listening websocket p2p port on: ' + p2pPort);
};

const getSockets = () => sockets;

const initConnection = (ws: WebSocket) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);

    // query transactions pool only some time after chain query
};

const JSONToObject = <T>(data: string): T => {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.log('[!] ', e);
        return null;
    }
};

const initMessageHandler = (ws: WebSocket) => {
    ws.on('message', (data: string) => {
        try {
            const message: Message = JSONToObject<Message>(data);
            if (message === null) {
                console.log('[!] Could not parse received JSON message: ' + data);
                return;
            }
            console.log('[*] Received message: %s', JSON.stringify(message));
            switch (message.type) {
                case MessageType.QUERY_LATEST:
                    //write(ws, responseLatestMsg());
                    //do nothing
                    break;
                case MessageType.QUERY_ALL:
                    //write(ws, responseChainMsg());
                    //do nothing
                    break;
                case MessageType.RESPONSE_BLOCKCHAIN:
                console.log('[!] Authenticator received blocks!!!!!!!!');
                /*
                Discard when HA receivedblocks
                const receivedBlocks: Block[] = JSONToObject<Block[]>(message.data);
                    if (receivedBlocks === null || receivedBlocks.length === 1){
                        console.log('[!] Invalid blocks received: %s', JSON.stringify(message.data));
                        break;
                    }
                    handleBlockchainResponse(receivedBlocks);
                    break;
                case MessageType.QUERY_TRANSACTION_POOL:
                    write(ws, responseTransactionPoolMsg());
                    break;
                case MessageType.RESPONSE_TRANSACTION_POOL:
                    console.log('[!] Authenticator received transaction!!!!!!!!');
                    const receivedTransactions: Transaction[] = JSONToObject<Transaction[]>(message.data);
                    if (receivedTransactions === null) {
                        console.log('[!] Invalid transaction received: %s', JSON.stringify(message.data));
                        break;
                    }
                    receivedTransactions.forEach((transaction: Transaction) => {
                        try {
                            handleReceivedTransaction(transaction);
                            // if no error is thrown, transaction was indeed added to the pool
                            // let's broadcast transaction pool
                            broadCastTransactionPool();
                        } catch (e) {
                            console.log('[!] ', e.message);
                        }
                    });
                    */
                    break;
                case MessageType.AUTHENTICATION_REQUEST:
                const identifier = JSON.parse(message.data);
                if (message.data === null) {
                    console.log('[-] Authpool: invalid identifier received: ', identifier);
                    ws.terminate();
                    }
                else{
                    addIdentifierToAuthPool(identifier);
                    console.log('[-] Authpool: identifier added', identifier);
                }
            }
        } catch (e) {
            console.log('[!] ', e);
        }
    });
};

const write = (ws: WebSocket, message: Message): void => ws.send(JSON.stringify(message));
const broadcast = (message: Message): void => sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = (): Message => ({'type': MessageType.QUERY_LATEST, 'data': null});

const queryAllMsg = (): Message => ({'type': MessageType.QUERY_ALL, 'data': null});

const responseChainMsg = (): Message => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(getBlockchain())
});

const responseLatestMsg = (): Message => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

const queryTransactionPoolMsg = (): Message => ({
    'type': MessageType.QUERY_TRANSACTION_POOL,
    'data': null
});

const responseTransactionPoolMsg = (): Message => ({
    'type': MessageType.RESPONSE_TRANSACTION_POOL,
    'data': JSON.stringify(getTransactionPool())
});

const initErrorHandler = (ws: WebSocket) => {
    const closeConnection = (myWs: WebSocket) => {
        console.log('[!] Connection failed to peer: ' + myWs.url);
        sockets.splice(sockets.indexOf(myWs), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

const handleBlockchainResponse = (receivedBlocks: Block[]) => {
    if (receivedBlocks.length === 0) {
        console.log('[!] Received block chain size of 0');
        return;
    }
    const latestBlockReceived: Block = receivedBlocks[receivedBlocks.length - 1];
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('[!] Block structuture not valid');
        return;
    }
    const latestBlockHeld: Block = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('[!] Received longer blockchain!');
        console.log('[!] Ignored block:'+ latestBlockReceived.index);
    } else {
        console.log('[!] Received blockchain is not longer than received blockchain.');
    }
};

const broadcastLatestChain = (): void => {
    broadcast(responseChainMsg());
};

const initWebInterface = (p2pPort: number) => {
  var http=require('http');
  var fs=require('fs');
  var express = require('express');
  var app = express();
  var bodyParser = require('body-parser');
  var tempData = [{"Number":0,"IPaddress":"192.168.2.128","type":"Router"},{"Number":1,"IPaddress":"192.168.2.132","type":"Router"},{"Number":2,"IPaddress":"192.168.2.134","type":"MultiLayer Switch"}];
  var Authed_Device = [];
  /*
  http.createServer(function(req,res){
      app.use(express.static('images'));
    //fs.readFile('/home/kevin/FYP_final/Auth/src/interface.html',function(err, data){
      fs.readFile('interface.php',function(err, data){
      res.writeHead(200, {'Content-Type': 'text/html'});
      //console.log(data);
      res.write(data);
      res.end();
    });
  }).listen(p2pPort);
  */
    app.use(express.static('public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get('/', function(req, res){
      res.sendFile("/home/kevin/FYP_final/Auth/public/interface.htm");
    });
    app.get('/getAuthDevice', function(req,res){
      res.send(Authed_Device);
    });
    app.post('/auth', function(req, res){
      var IPAddr = req.body.IP_address;
      var DeviceID = req.body.Number;
      var DeviceType = req.body.Type;
      console.log(DeviceID+" "+IPAddr+" "+DeviceType);
      Authed_Device.push({
        Number: DeviceID,
        IP_address: IPAddr,
        Type: DeviceType
      });
      res.send("Auth those network");
      console.log(Authed_Device);
    });
    app.get('/scan', function(req, res){

      res.send(tempData);
    });
    var server = app.listen(p2pPort, function(){
    var host = server.address().address;
    var port = server.address().port;
    });
    console.log('[*] Listening websocket Web interface port on: ' + p2pPort);
};

const connectToPeers = (newPeer: string): void => {
    const ws: WebSocket = new WebSocket(newPeer);
    ws.on('open', () => {
        initConnection(ws);
    });
    ws.on('error', () => {
        console.log('[!] connection failed');
    });
};

const removeConnection = () => {
    for (const client of getSockets()) {
        client.close();
    }
}

const broadCastTransactionPool = () => {
    broadcast(responseTransactionPoolMsg());
};

export { connectToPeers, broadcastLatestChain, broadCastTransactionPool, initP2PServer, getSockets, removeConnection,initWebInterface};
