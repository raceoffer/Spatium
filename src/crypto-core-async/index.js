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

export { CompoundKey } from './lib/compoundkey';
export { BitcoinTransaction } from './lib/bitcointransaction';
export { BitcoinCashTransaction } from './lib/bitcoincashtransaction';
export { LitecoinTransaction } from './lib/litecointransaction';
export { EthereumTransaction } from './lib/ethereumtransaction';

import * as Utils from './lib/utils';
export { Utils };

export { createWorker } from './lib/createworker';
