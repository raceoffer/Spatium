declare var bcoin: any;
declare var CompoundKey: any;
declare var DDS: any;
declare var Transaction: any;
declare var Utils: any;
declare var Web3: any;
declare var Buffer: any;

export class Signature {
  static web3 = new Web3();


  //static aesKey = 'kljhjk';
  // TODO: import Buffer
  static aesKey = Buffer.from(
    '57686f277320796f75722064616464793f313837333631393832373336383133f75722064616464793f3138373336313',
    'hex'
  );

  static encrypt(buffer: any, secret: any): any {
    return bcoin.crypto.aes.encipher(buffer, secret.slice(0, 32), secret.slice(32, 48));
  }

  public static async getDDS() {
    // TODO: get key from file
    let key = this.web3.eth.accounts.create().privateKey;

    let ddsObj = new DDS({
      privateKey: key,
      infuraToken: 'DKG18gIcGSFXCxcpvkBm'
    });

    return ddsObj;
  }

  public static async getKeyring(dds: any) {
    // TODO: get key from file
    const key = CompoundKey.generateKeyring();

    // await dds.store({
    //   data: bcoin.utils.base58.encode(this.encrypt(key.getPrivateKey(), this.aesKey)),
    //   gasPrice: this.web3.utils.toWei('5', 'gwei')
    // });

    return key;
  }

  public static computeSignature(options: any): any {
    const initiatorTX = options.tx;

    // Signing process
    /// Step 1: Iniiator initiates
    //// Calculating hashes
    const initiatorHashes = initiatorTX.getHashes();
    //// Picking a correct partial key for every input
    const initiatorMap = initiatorTX.mapCompoundKeys(options.initiator);
    //// Prepare signer objects
    const initiatorSigners = Transaction.startSign(initiatorHashes, initiatorMap);
    //// Generate synchronization data
    const initiatorEntropyCommitments = JSON.stringify(Transaction.createEntropyCommitments(initiatorSigners));

    /// Emulating send/receive
    const verifierTX = Transaction.fromJSON(JSON.parse(JSON.stringify(initiatorTX.toJSON())));

    /// Step 2: Verifier receives commitments and prepares it's own
    /// From now on we assume that verifier also receives tx and computes input map and hashes independently
    const verifierHashes = verifierTX.getHashes();
    //// Picking a correct partial key for every input
    const verifierMap = verifierTX.mapCompoundKeys(options.verifier);
    //// Prepare signer objects
    const verifierSigners = Transaction.startSign(verifierHashes, verifierMap);
    //// Generate synchronization data
    const verifierEntropyCommitments = JSON.stringify(Transaction.createEntropyCommitments(verifierSigners));

    const initiatorDecommitments = JSON.stringify(Transaction.processEntropyCommitments(initiatorSigners, JSON.parse(verifierEntropyCommitments)));
    const verifierDecommitments = JSON.stringify(Transaction.processEntropyCommitments(verifierSigners, JSON.parse(initiatorEntropyCommitments)));

    /// Step 3: Initiator receives commitment and both peers synchronize
    Transaction.processEntropyDecommitments(initiatorSigners, JSON.parse(verifierDecommitments));
    Transaction.processEntropyDecommitments(verifierSigners, JSON.parse(initiatorDecommitments));

    /// Step 4: Verifier computes ciphertexts on accept
    const ciphertexts = Transaction.computeCiphertexts(verifierSigners);

    /// Step 5: Initiator receives ciphertexts and finalizes signatures
    return Transaction.extractSignatures(initiatorSigners, ciphertexts).map(Utils.encodeSignature);
  }

};

