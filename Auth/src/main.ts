console.log("[*] Blockchain-authenticator node start! ");
import * as  bodyParser from 'body-parser';
import * as express from 'express';
import * as _ from 'lodash';
import {
    Block, generateNextBlock, generatenextBlockWithTransaction, generateRawNextBlock, getHostAccountBalance,
    getBlockchain, getMyUnspentTransactionOutputs, getUnspentTxOuts, sendTransaction, getAccountBalance,
    sendAuthTransaction, getAuthPool
} from './blockchain';
import {connectToPeers, getSockets, initP2PServer, removeConnection,initWebInterface} from './p2p';
import {UnspentTxOut} from './transaction';
import {getTransactionPool} from './transactionPool';
import {getPublicFromWallet, initWallet} from './wallet';

const httpPort: number = parseInt(process.env.HTTP_PORT) || 3003;
const p2pPort: number = parseInt(process.env.P2P_PORT) || 6003;

const initHttpServer = (myHttpPort: number) => {
    const app = express();
    app.use(bodyParser.json());

    app.use((err, req, res, next) => {
        if (err) {
            res.status(400).send(err.message);
        }
    });

    app.get('/blocks', (req, res) => {
        res.send(getBlockchain());
    });

    app.get('/block/:hash', (req, res) => {
        const block = _.find(getBlockchain(), {'hash' : req.params.hash});
        res.send(block);
    });

    app.get('/transaction/:id', (req, res) => {
        const tx = _(getBlockchain())
            .map((blocks) => blocks.data)
            .flatten()
            .find({'id': req.params.id});
        res.send(tx);
    });

    app.get('/address/:address', (req, res) => {
        const unspentTxOuts: UnspentTxOut[] =
            _.filter(getUnspentTxOuts(), (uTxO) => uTxO.address === req.params.address);
        res.send({'unspentTxOuts': unspentTxOuts});
    });

    app.get('/validate/:address', (req, res) => {
        const balance: number = getAccountBalance(req.params.address);
        if (balance === 2 )
            res.send('true');
        else
            res.send('false');
    });

    app.get('/balance/:address', (req, res) => {
        const balance: number = getAccountBalance(req.params.address);
        res.send({'balance': balance});
    });

    app.get('/unspentTransactionOutputs', (req, res) => {
        res.send(getUnspentTxOuts());
    });

    app.get('/myUnspentTransactionOutputs', (req, res) => {
        res.send(getMyUnspentTransactionOutputs());
    });

    app.post('/mineRawBlock', (req, res) => {
        if (req.body.data == null) {
            res.send('data parameter is missing');
            return;
        }
        const newBlock: Block = generateRawNextBlock(req.body.data);
        if (newBlock === null) {
            res.status(400).send('could not generate block');
        } else {
            res.send(newBlock);
        }
    });

    app.post('/mineBlock', (req, res) => {
        const newBlock: Block = generateNextBlock();
        if (newBlock === null) {
            res.status(400).send('could not generate block becasue no transaction');
        } else {
            res.send(newBlock);
        }
    });

    app.get('/balance', (req, res) => {
        const balance: number = getHostAccountBalance();
        res.send({'balance': balance});
    });

    app.get('/address', (req, res) => {
        const address: string = getPublicFromWallet();
        res.send({'address': address});
    });

    app.post('/mineTransaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = generatenextBlockWithTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log('[!] ', e.message);
            res.status(400).send(e.message);
        }
    });

    app.post('/sendTransaction', (req, res) => {
        try {
            const address = req.body.address;
            const amount = req.body.amount;

            if (address === undefined || amount === undefined) {
                throw Error('invalid address or amount');
            }
            const resp = sendTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log('[!] ', e.message);
            res.status(400).send(e.message);
        }
    });

    app.get('/authDevice/:address', (req, res) => {
        try {
            const address = req.params.address;

            if (address === undefined) {
                throw Error('invalid address');
            }
            const resp = sendAuthTransaction(address);
            res.send(resp);
        } catch (e) {
            console.log('[!] ', e.message);
            res.status(400).send(e.message);
        }
    });

    app.get('/authAll', (req, res) => {
      let Authpool: Array<string> = getAuthPool();
      let newBlock: Block[] = [];
      for (let addr of Authpool) {
        console.log('[-] Authenticate : ' + addr);
        sendAuthTransaction(addr);
        const nextBlock: Block = generateNextBlock();
        newBlock.push(nextBlock);
        Authpool.pop();
      }
      if (newBlock === null) {
          res.status(400).send('could not generate block becasue no transaction');
      } else {
          res.send(newBlock);
      }
    });

    app.get('/transactionPool', (req, res) => {
        res.send(getTransactionPool());
    });

    app.get('/peers', (req, res) => {
        res.send(getSockets().map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });

    app.post('/stop', (req, res) => {
        removeConnection();
        res.send({'msg' : 'stopping server'});
        process.exit();
    });

    app.get('/disconnect', (req, res) => {
        removeConnection();
        res.send({'msg' : 'remove all connection'});
    });

    app.listen(myHttpPort, () => {
        console.log('[*] Listening http on port: ' + myHttpPort);
    });
};

initHttpServer(httpPort);
initP2PServer(p2pPort);
initWebInterface(8008);
