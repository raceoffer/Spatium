declare var bcoin: any;

export class Wallet {

  public static walletdb = new bcoin.walletdb({
    db: 'memory',
    location: 'test'
  });

}
