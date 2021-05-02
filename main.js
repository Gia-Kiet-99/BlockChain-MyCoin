const {BlockChain, Transaction} = require('./model/blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('8b6f7cb3ebcfcb25fbed289d00399012bed7157c58699f6f2412afc32f953b22');
const myWalletAddress = myKey.getPublic('hex');


let GKcoin = new BlockChain();

const trans1 = new Transaction(myWalletAddress, 'public key goes here', 10);
trans1.signTransaction(myKey);
GKcoin.addTransaction(trans1);

console.log('\nStarting the miner...');
GKcoin.miningPendingTransactions(myWalletAddress);
GKcoin.miningPendingTransactions("orther miner");

console.log("giakiet balance is " + GKcoin.getBalanceOfAddress(myWalletAddress));
