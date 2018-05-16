import PromiseWorker from 'promise-worker';

import * as Utils from './lib/utils';
import { CompoundKey } from './lib/compoundkey';
import { BitcoinTransaction } from './lib/bitcointransaction';
import { BitcoinCashTransaction } from './lib/bitcoincashtransaction';
import { LitecoinTransaction } from './lib/litecointransaction';
import { EthereumTransaction } from './lib/ethereumtransaction';

const worker = new PromiseWorker(new Worker('webworker.bundle.js'));

Utils.useWorker(worker);
CompoundKey.useWorker(worker);
BitcoinTransaction.useWorker(worker);
BitcoinCashTransaction.useWorker(worker);
LitecoinTransaction.useWorker(worker);
EthereumTransaction.useWorker(worker);

export { default as BN } from 'bn.js';

export { KeyChain } from 'crypto-core/lib/primitives/keychain';

export { BitcoinWallet } from 'crypto-core/lib/wallet/bitcore/bitcoinwallet';
export { BitcoinCashWallet } from 'crypto-core/lib/wallet/bitcore/bitcoincashwallet';
export { LitecoinWallet } from 'crypto-core/lib/wallet/bitcore/litecoinwallet';
export { EthereumWallet } from 'crypto-core/lib/wallet/ethereum/ethereumwallet';
export { ERC20Wallet } from 'crypto-core/lib/wallet/ethereum/erc20wallet';

export { SchnorrProof } from 'crypto-core/lib/primitives/schnorrproof';
export { PaillierProver } from 'crypto-core/lib/primitives/paillierprover';
export { PaillierVerifier } from 'crypto-core/lib/primitives/paillierverifier';
export { PedersenScheme } from 'crypto-core/lib/primitives/pedersenscheme';
export { Signer } from 'crypto-core/lib/primitives/signer';
export { DDS } from 'crypto-core/lib/primitives/dds';

export {
  Utils,
  CompoundKey,
  BitcoinTransaction,
  BitcoinCashTransaction,
  LitecoinTransaction,
  EthereumTransaction
};
