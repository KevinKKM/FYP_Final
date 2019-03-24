/*
Blockchain controller
- Identifier printing call by this JS file(main->p2p?or other->blockchain->wallet->getPublicFromWallet->)
- Auth main controller

*/
import * as WebSocket from 'ws';
import {Server} from 'ws';
import {
    addBlockToChain, addGenesisToChain, Block, getBlockchain, getLatestBlock, handleReceivedTransaction, isValidBlockStructure,
    replaceChain, verifyChainKey, getChainLength,getPublicFromWallet
} from './blockchain';
import {Transaction} from './transaction';
import {getTransactionPool} from './transactionPool';
import {setFlag} from './protocol';

const sockets: WebSocket[] = [];
var alive_connection = 0;
var shell = require('shelljs');
var current_addr = "";
var directory = shell.pwd().toString();
var enable_auth_arp = "";
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

const getAliveConn = () => {
  return alive_connection;
}

const initP2PServer = (p2pPort: number) => {
    const server: Server = new WebSocket.Server({port: p2pPort});
    server.on('connection', (ws: WebSocket, req) => {
        const ip = req.connection.remoteAddress;
        console.log('[+] Connection from IP:' + ip);
        current_addr = ip.split(":")[ip.split(":").length-1];
        initConnection(ws);
    });
    console.log('[*] Listening websocket p2p port on: ' + p2pPort);
};

const getSockets = () => sockets;

const EnableAuth = () => {
  console.log("Enable Auth");
  shell.exec(enable_auth_arp);
};
//Create the websocket (Constructure the Socket)
const initConnection = (ws: WebSocket) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());

    if (getLatestBlock() === undefined){
        write(ws, authReqMsg());
        console.log('[*] Event: Send Authentication request');
        console.log(current_addr);
        var command = directory+'/ShellCall/Authaccept.sh '+current_addr;

        enable_auth_arp = command;
    }

    // query transactions pool only some time after chain query
    setTimeout(() => {
        broadcast(queryChainLengthMsg());
    }, 500);
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
            //console.log('[*] Received message: %s', JSON.stringify(message));
            if (getChainLength() > 1){
              switch (message.type) {
                  case MessageType.QUERY_LATEST:
                      write(ws, responseLatestMsg());
                      break;
                  case MessageType.QUERY_ALL:
                      write(ws, responseChainMsg());
                      break;
                  case MessageType.RESPONSE_BLOCKCHAIN:
                      const receivedBlocks: Block[] = JSONToObject<Block[]>(message.data);
                      if (receivedBlocks === null) {
                          console.log('[!] Invalid blocks received: %s', JSON.stringify(message.data));
                          break;
                      }
                      handleBlockchainResponse(receivedBlocks);
                      break;
                  case MessageType.QUERY_TRANSACTION_POOL:
                      write(ws, responseTransactionPoolMsg());
                      break;
                  case MessageType.RESPONSE_TRANSACTION_POOL:
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
                              console.log('[!] ',e.message);
                          }
                      });
                      break;
                  case MessageType.CHAIN_KEY_VERIFY:
                      const ReceivedKey = JSON.parse(message.data);
                      if (message.data === null) {
                          console.log('[!] invalid chain key received: ', ReceivedKey);
                          ws.terminate();
                      }
                      else {
                          const result = verifyChainKey(ReceivedKey);
                          if (result) {
                              write(ws, responseAuthMsg(result));
                              console.log("[#] Server Auth success!")
                          }
                          else {
                              write(ws, responseAuthMsg(result));
                              console.log("[!] Server Auth failed! Terminated connection")
                              ws.terminate();
                          }
                      }
              }
            }
            else{
              switch (message.type) {
                  case MessageType.QUERY_LATEST:
                      write(ws, responseLatestMsg());
                      break;
                  case MessageType.QUERY_ALL:
                      write(ws, responseChainMsg());
                      break;
                  case MessageType.RESPONSE_BLOCKCHAIN:
                      const receivedBlocks: Block[] = JSONToObject<Block[]>(message.data);
                      if (receivedBlocks === null) {
                          console.log('[!] Invalid blocks received: %s', JSON.stringify(message.data));
                          break;
                      }
                      handleBlockchainResponse(receivedBlocks);
                      break;
              }
            }
        } catch (e) {
            console.log('[!]',e);
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

const authChainKeyMsg = (chainKey: string): Message => ({
    'type': MessageType.CHAIN_KEY_VERIFY,
    'data': JSON.stringify(chainKey)
});

const responseAuthMsg = (response: boolean): Message => ({
    'type': MessageType.CHAIN_KEY_VERIFY,
    'data': JSON.stringify(response)
});

const authReqMsg = (): Message => ({
    'type': MessageType.AUTHENTICATION_REQUEST,
    'data': JSON.stringify(getPublicFromWallet())
});

const initErrorHandler = (ws: WebSocket) => {
    const closeConnection = (myWs: WebSocket) => {
        console.log('[!] Connection failed to peer: ' + myWs.url);
        sockets.splice(sockets.indexOf(myWs), 1);
        if(getAliveConn()==0){
          setFlag(false);
        }

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
    if (latestBlockHeld === undefined){
      console.log('[*] Empty Blockchain detected');
      replaceChain(receivedBlocks);
    }else{
      if (latestBlockReceived.index > latestBlockHeld.index) {
          console.log('[*] Blockchain possibly behind. We got: '
              + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
          if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
              if (addBlockToChain(latestBlockReceived)) {
                  broadcast(responseLatestMsg());
              }
          } else if (receivedBlocks.length === 1) {
              console.log('[*] We have to query the chain from our peer');
              broadcast(queryAllMsg());
          } else {
              console.log('[*] Received blockchain is longer than current blockchain');
              replaceChain(receivedBlocks);
          }
      } else {
          console.log('[*] received blockchain is not longer than received blockchain. Do nothing');
      }
    }
};

const broadcastLatest = (): void => {
    broadcast(responseLatestMsg());
};

const connectToPeers = (newPeer: string, chainKey: string): void => {
    const ws: WebSocket = new WebSocket(newPeer);
    ws.on('open', () => {
        write(ws, authChainKeyMsg(chainKey));
        ws.on('message', (data: string) => {
            try {
                const message: Message = JSONToObject<Message>(data);
                if (message.type == MessageType.CHAIN_KEY_VERIFY) {
                    if (message.data == 'true') {
                        console.log("[*] Auth success! Init connection");
                        alive_connection++;
                        initConnection(ws);
                    }
                    else {
                        console.log("[!] Auth failed! Terminate connection");
                        ws.terminate();
                    }
                }
            }
            catch (e) {
                console.log('[!] ', e);
            }
        });
    });
    ws.on('error', function(event){
        console.log('[!] connection error :' + event);
    });
    ws.on('close', () => {
        console.log('[!] connection failed');
        alive_connection--;
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

export { connectToPeers, broadcastLatest, broadCastTransactionPool,
  initP2PServer, getSockets, removeConnection, JSONToObject, getAliveConn, EnableAuth};
