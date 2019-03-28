import * as CryptoJS from 'crypto-js';
import * as _ from 'lodash';
//import * as si from 'systeminformation';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { ec } from 'elliptic';
import {broadcastLatestChain, broadCastTransactionPool} from './p2p';
import {
    getCoinbaseTransaction, isValidAddress, processTransactions, Transaction, UnspentTxOut, TxIn, TxOut, getTransactionId
} from './transaction';
import {addToTransactionPool, getTransactionPool, updateTransactionPool} from './transactionPool';
import {hexToBinary} from './util';
import { createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet } from './wallet';
var sizeof = require('object-sizeof');

const EC = new ec('secp256k1');
const privateChainKeyLocation = process.env.CHAIN_PRIVATE_KEY || 'node/chain/private_key';

const generatePrivateChainKey = () => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate().toString(16);
    writeFileSync(privateChainKeyLocation, privateKey);
    console.log('[#] Chain private key generated: ' + privateChainKeyLocation);
};

const getChainPrivateFromFile = (): string => {
    const buffer = readFileSync(privateChainKeyLocation, 'utf8');
    return buffer.toString();
};

const getChainPublicFromFile = (): string => {
    if (!existsSync(privateChainKeyLocation)) {
        console.log('[!] Chain private key missing...');
        generatePrivateChainKey();
    }
    const privateKey = getChainPrivateFromFile()
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
};

const PublicChainKey = getChainPublicFromFile();

class Block {

    public index: number;
    public hash: string;
    public previousHash: string;
    public timestamp: number;
    public data: Transaction[];
    public difficulty: number;
    public nonce: number;

    constructor(index: number, hash: string, previousHash: string,
                timestamp: number, data: Transaction[], difficulty: number, nonce: number) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

const getPublicFromChain = (): string => {
    return (blockchain[0]['data'][0]['chainKey']);
};

const getAuthIdFromChain = (): string => {
    return (blockchain[0]['data'][0]['authIdentifier']);
};

const generateGenesisTransaction = (address: string): Transaction => {
    const t = new Transaction();
    const txIn: TxIn = new TxIn();
    txIn.signature = '';
    txIn.txOutId = '';
    txIn.txOutIndex = 0;

    t['chainKey'] = PublicChainKey;
    t['authIdentifier'] = getPublicFromWallet();

    t.txIns = [txIn];
    t.txOuts = [new TxOut(address, 50)];
    t.id = getTransactionId(t);
    return t;
};

const genesisHash = (): string => {
    return CryptoJS.SHA256('0' + '' + '1465154705' + [generateGenesisTransaction(getPublicFromWallet())] + '0' + '0').toString();
}

const genesisBlock: Block = new Block(
    0, genesisHash(), '', 1465154705, [generateGenesisTransaction(getPublicFromWallet())], 0, 0
);

let blockchain: Block[] = [genesisBlock];

let authPool: Array<string> = [];

let getAuthPool = ():Array<string> => authPool;

const addIdentifierToAuthPool = (identifier: string) => {
  authPool.push(identifier);
};

// the unspent txOut of genesis block is set to unspentTxOuts on startup
let unspentTxOuts: UnspentTxOut[] = processTransactions(blockchain[0].data, [], 0);

const getBlockchain = (): Block[] => blockchain;

const getUnspentTxOuts = (): UnspentTxOut[] => _.cloneDeep(unspentTxOuts);

// and txPool should be only updated at the same time
const setUnspentTxOuts = (newUnspentTxOut: UnspentTxOut[]) => {
    console.log('[*] replacing unspentTxouts with: %s', newUnspentTxOut);
    unspentTxOuts = newUnspentTxOut;
};

const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

// in seconds
const BLOCK_GENERATION_INTERVAL: number = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 5;

console.log('[#] Chain public key :', getPublicFromChain());
console.log('[#] Identifier :', getPublicFromWallet());

const getWalletfromChain = (): string => {
    return getBlockchain()[0].data[0]['txOuts'][0]['address'];
}

const getDifficulty = (aBlockchain: Block[]): number => {
    const latestBlock: Block = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    } else {
        return latestBlock.difficulty;
    }
};

const getAdjustedDifficulty = (latestBlock: Block, aBlockchain: Block[]) => {
    const prevAdjustmentBlock: Block = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected: number = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken: number = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    } else {
        return prevAdjustmentBlock.difficulty;
    }
};

const getCurrentTimestamp = (): number => Math.round(new Date().getTime() / 1000);

const generateRawNextBlock = (blockData: Transaction[]) => {
    const previousBlock: Block = getLatestBlock();
    const difficulty: number = getDifficulty(getBlockchain());
    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = getCurrentTimestamp();
    const newBlock: Block = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    if (addBlockToChain(newBlock)) {
        broadcastLatestChain();
        return newBlock;
    } else {
        return null;
    }

};

// gets the unspent transaction outputs owned by the wallet
const getMyUnspentTransactionOutputs = () => {
    return findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts());
};

const generateNextBlock = () => {
    //block reward to miner
    //const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);

    //block reward to authorized device
    if (getTransactionPool()[0]) {
        const coinbaseTx: Transaction = getCoinbaseTransaction(getTransactionPool()[0]['txOuts'][0]['address'], getLatestBlock().index + 1);
        console.log("block reward goes to authorized device:", getTransactionPool()[0]['txOuts'][0]['address']);
        const blockData: Transaction[] = [coinbaseTx].concat(getTransactionPool());
        if (getTransactionPool().length != 0) {
            return generateRawNextBlock(blockData);
        }
        else {
            return generateRawNextBlock(blockData);
        }
    }
    else {
        const coinbaseTx: Transaction = getCoinbaseTransaction(getWalletfromChain(), getLatestBlock().index + 1);
        console.log("block reward goes to authorizer:", getWalletfromChain());
        const blockData: Transaction[] = [coinbaseTx].concat(getTransactionPool());
        if (getTransactionPool().length != 0) {
            return generateRawNextBlock(blockData);
        }
        else {
            return generateRawNextBlock(blockData);
        }
    }
};

const generatenextBlockWithTransaction = (receiverAddress: string, amount: number) => {
    if (!isValidAddress(receiverAddress)) {
        throw Error('invalid address');
    }
    if (typeof amount !== 'number') {
        throw Error('invalid amount');
    }
    const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const tx: Transaction = createTransaction(receiverAddress, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    const blockData: Transaction[] = [coinbaseTx, tx];
    return generateRawNextBlock(blockData);
};

const findBlock = (index: number, previousHash: string, timestamp: number, data: Transaction[], difficulty: number): Block => {
    let nonce = 0;
    while (true) {
        const hash: string = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
        }
        nonce++;
    }
};

const getHostAccountBalance = (): number => {
    return getBalance(getPublicFromWallet(), getUnspentTxOuts());
};

const getAccountBalance = (account: string): number => {
    return getBalance(account, getUnspentTxOuts());
};

const sendTransaction = (address: string, amount: number): Transaction => {
    const tx: Transaction = createTransaction(address, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    addToTransactionPool(tx, getUnspentTxOuts());
    broadCastTransactionPool();
    return tx;
};

const sendAuthTransaction = (address: string) => {
    const amount = 1;
    if (getPublicFromWallet()===getAuthIdFromChain()){
      const tx: Transaction = createTransaction(address, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
      addToTransactionPool(tx, getUnspentTxOuts());
      //broadCastTransactionPool();
      //no need to broadcast to others
      return tx;
    }
    else{
      console.log("Authentication: Source address mismatch with blockchain");
      //console.log("invalid transaction from" + getPublicFromWallet() + "to" + getPublicFromChain() + "detected!");
      return false;
    }
};

const calculateHashForBlock = (block: Block): string =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const calculateHash = (index: number, previousHash: string, timestamp: number, data: Transaction[],
                       difficulty: number, nonce: number): string =>
    CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();

const isValidBlockStructure = (block: Block): boolean => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'object';
};

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
    if (!isValidBlockStructure(newBlock)) {
        console.log('invalid block structure: %s', JSON.stringify(newBlock));
        return false;
    }
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (!isValidTimestamp(newBlock, previousBlock)) {
        console.log('invalid timestamp');
        return false;
    } else if (!hasValidHash(newBlock)) {
        return false;
    }
    return true;
};

const getAccumulatedDifficulty = (aBlockchain: Block[]): number => {
    return aBlockchain
        .map((block) => block.difficulty)
        .map((difficulty) => Math.pow(2, difficulty))
        .reduce((a, b) => a + b);
};

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
    return ( previousBlock.timestamp - 60 < newBlock.timestamp )
        && newBlock.timestamp - 60 < getCurrentTimestamp();
};

const hasValidHash = (block: Block): boolean => {

    if (!hashMatchesBlockContent(block)) {
        console.log('invalid hash, got:' + block.hash);
        return false;
    }

    if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
        console.log('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
    }
    return true;
};

const hashMatchesBlockContent = (block: Block): boolean => {
    const blockHash: string = calculateHashForBlock(block);
    return blockHash === block.hash;
};

const hashMatchesDifficulty = (hash: string, difficulty: number): boolean => {
    const hashInBinary: string = hexToBinary(hash);
    const requiredPrefix: string = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
};

/*
    Checks if the given blockchain is valid. Return the unspent txOuts if the chain is valid
 */
const isValidChain = (blockchainToValidate: Block[]): UnspentTxOut[] => {
    console.log('isValidChain:');
    console.log(JSON.stringify(blockchainToValidate));
    const isValidGenesis = (block: Block): boolean => {
        console.log("received gensis block", block);
        //return JSON.stringify(block) === JSON.stringify(genesisBlock);
        return true;
    };

    if (!isValidGenesis(blockchainToValidate[0])) {
        console.log('invalid genesis detected!')
        return null;
    }
    /*
    Validate each block in the chain. The block is valid if the block structure is valid
      and the transaction are valid
     */
    let aUnspentTxOuts: UnspentTxOut[] = [];

    for (let i = 0; i < blockchainToValidate.length; i++) {
        const currentBlock: Block = blockchainToValidate[i];
        if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return null;
        }

        aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
        if (aUnspentTxOuts === null) {
            console.log('invalid transactions in blockchain');
            return null;
        }
    }
    return aUnspentTxOuts;
};

const addBlockToChain = (newBlock: Block): boolean => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        const retVal: UnspentTxOut[] = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
        if (retVal === null) {
            console.log('block is not valid in terms of transactions');
            return false;
        } else {
            blockchain.push(newBlock);
            setUnspentTxOuts(retVal);
            updateTransactionPool(unspentTxOuts);
            console.log('[*] Size of chain :', sizeof(getBlockchain()));
            return true;
        }
    }
    return false;
};

const handleReceivedTransaction = (transaction: Transaction) => {
    addToTransactionPool(transaction, getUnspentTxOuts());
};

const verifyChainKey = (ChainKey: string): boolean => {
    const key = EC.keyFromPrivate(ChainKey.replace(/['"]+/g, ''), 'hex');
    return (key.getPublic().encode('hex') == getPublicFromChain());
}

export {
    Block, getBlockchain, getUnspentTxOuts, getLatestBlock, sendTransaction,
    generateRawNextBlock, generateNextBlock, generatenextBlockWithTransaction,
    handleReceivedTransaction, getMyUnspentTransactionOutputs,
    getHostAccountBalance, getAccountBalance, isValidBlockStructure,
    addBlockToChain, verifyChainKey, sendAuthTransaction,
    getAuthPool, addIdentifierToAuthPool
};
