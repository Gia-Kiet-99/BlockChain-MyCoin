const SHA256 = require('crypto-js').SHA256;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


/* -------------------- Transaction ------------------- */
class TxInput {
  constructor(txOutId, txOutIndex) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
  }
}

class TxOutput {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class Transaction {
  /**
 * @param {string} fromAddress
 * @param {string} toAddress
 * @param {number} amount
 */
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transaction for other wallet!');
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

/* -------------------- Block ------------------- */

class Block {
  constructor(index, timestamp, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
  }

  mineBlock(difficulty) {
    console.log("Mining...");
    const prefix = "".padStart(difficulty, "0");
    while (!this.hash.startsWith(prefix)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for (const trans of this.transactions) {
      if (!trans.isValid()) {
        return false;
      }
    }
    return true;
  }

}

/* -------------------- BlockChain ------------------- */

class BlockChain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(0, new Date().getTime(), "Genesis block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  miningPendingTransactions(miningRewardAddress) {
    let block = new Block(
      this.getLatestBlock().index + 1,
      new Date().getTime(),
      this.pendingTransactions,
      this.getLatestBlock().hash);

    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningReward)];
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      }
    }
    return balance;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address')
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    this.pendingTransactions.push(transaction);
  }

  isChainValid() {
    let currentBlock = null;
    let previousBlock = null;
    for (let i = 1; i < this.chain.length; i++) {
      currentBlock = this.chain[i];
      previousBlock = this.chain[i - 1];

      if (currentBlock.index !== previousBlock.index + 1)
        return false;

      if (!currentBlock.hasValidTransactions())
        return false;

      if (currentBlock.previousHash !== previousBlock.hash)
        return false;

      if (currentBlock.hash !== currentBlock.calculateHash())
        return false;

    }
    return true;
  }
}

module.exports = { BlockChain, Transaction };