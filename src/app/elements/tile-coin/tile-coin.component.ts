import {Component, Input, OnInit, Output, EventEmitter, HostBinding} from '@angular/core';

@Component({
  selector: 'app-tile-coin',
  templateUrl: './tile-coin.component.html',
  styleUrls: ['./tile-coin.component.css']
})
export class TileCoinComponent implements OnInit {
  @HostBinding('class') classes = 'tile-coin';

  @Input() coin: any = {};
  @Input() balanceInfo: any = {};
  @Input() synchronizing = false;

  @Output() onClicked: EventEmitter<any> = new EventEmitter<any>();

  logo = '';

  private logos = {
    'bitcoin': 'assets/images/drawable/currency/bitcoin.svg',
    'ethereum': 'assets/images/drawable/currency/ethereum.svg',
    'ripple': 'assets/images/drawable/currency/ripple.svg',
    'bitcoin-cash': 'assets/images/drawable/currency/bitcoin-cash.svg',
    'cardano': 'assets/images/drawable/currency/cardano.svg',
    'neo': 'assets/images/drawable/currency/neo.svg',
    'litecoin': 'assets/images/drawable/currency/litecoin.svg',
    'stellar': 'assets/images/drawable/currency/stellar.svg',
    'eos': 'assets/images/drawable/currency/eos.svg',
    'nem': 'assets/images/drawable/currency/nem.svg',
    'tron': 'assets/images/drawable/currency/tron.svg',
    'veChain': 'assets/images/drawable/currency/ven.svg',
    'icon': 'assets/images/drawable/currency/icon.svg',
    'omiseGO': 'assets/images/drawable/currency/omisego.svg',
    'binanceCoin': 'assets/images/drawable/currency/binance-coin.svg',
    'digixDAO': 'assets/images/drawable/currency/digix-dao.svg',
    'populous': 'assets/images/drawable/currency/populous.svg',
    'rchain': 'assets/images/drawable/currency/rchain.svg',
    'maker': 'assets/images/drawable/currency/maker.svg',
    'aeternity': 'assets/images/drawable/currency/aeternity.svg',
    'augur': 'assets/images/drawable/currency/augur.svg',
    'status': 'assets/images/drawable/currency/status.svg',
    'bytom': 'assets/images/drawable/currency/bytom.svg',
    'aion': 'assets/images/drawable/currency/aion.svg',
    'waltonchain': 'assets/images/drawable/currency/waltonchain.svg',
    'ox': 'assets/images/drawable/currency/0x.svg',
    'zilliqa': 'assets/images/drawable/currency/zilliqa.svg',
    'kuCoinShares': 'assets/images/drawable/currency/kuCoinShares.svg',
    'veritaseum': 'assets/images/drawable/currency/veritaseum.svg',
    'qash': 'assets/images/drawable/currency/qash.svg',
    'loopring': 'assets/images/drawable/currency/loopring.svg',
    'ethos': 'assets/images/drawable/currency/ethos.svg',
    'golem': 'assets/images/drawable/currency/golem.svg',
    'nebulas': 'assets/images/drawable/currency/nebulas.svg',
    'dragonchain': 'assets/images/drawable/currency/dragonchain.svg',
    'basicAttentionToken': 'assets/images/drawable/currency/basicAttentionToken.svg',
    'revain': 'assets/images/drawable/currency/revain.svg',
    'funFair': 'assets/images/drawable/currency/funfair.svg',
    'kyberNetwork': 'assets/images/drawable/currency/kyberNetwork.svg',
    'iostoken': 'assets/images/drawable/currency/iostoken.svg',
    'aelf': 'assets/images/drawable/currency/aelf.svg',
    'requestNetwork': 'assets/images/drawable/currency/requestNetwork.svg',
    'salt': 'assets/images/drawable/currency/salt.svg',
    'chainLink': 'assets/images/drawable/currency/chainLink.svg',
    'polymath': 'assets/images/drawable/currency/polymath.svg',
    'powerLedger': 'assets/images/drawable/currency/powerLedger.svg',
    'kin': 'assets/images/drawable/currency/kin.svg',
    'dentacoin': 'assets/images/drawable/currency/dentacoin.svg',
    // 'nucleusVision': 'assets/images/drawable/currency/nucleusVision.svg',
    'bancor': 'assets/images/drawable/currency/bancor.svg',
    'tenx': 'assets/images/drawable/currency/tenx.svg',
    'enigma': 'assets/images/drawable/currency/enigma.svg',
    'cindicator': 'assets/images/drawable/currency/cindicator.svg',
    'aragon': 'assets/images/drawable/currency/aragon.svg',
    'storj': 'assets/images/drawable/currency/storj.svg',
    'nuls': 'assets/images/drawable/currency/nuls.svg',
    'iconomi': 'assets/images/drawable/currency/iconomi.svg',
    'dent': 'assets/images/drawable/currency/dent.svg',
    'storm': 'assets/images/drawable/currency/storm.svg',
    'pillar': 'assets/images/drawable/currency/pillar.svg',
    'metal': 'assets/images/drawable/currency/metal.svg',
    'quantstamp': 'assets/images/drawable/currency/quantstamp.svg',
    'substratum': 'assets/images/drawable/currency/substratum.svg',
    'gnosis': 'assets/images/drawable/currency/gnosis.svg',
    'sirinLabsToken': 'assets/images/drawable/currency/sirinLabsToken.svg',
    'decentraland': 'assets/images/drawable/currency/decentraland.svg',
    'genesisVision': 'assets/images/drawable/currency/genesisVision.svg',
    'civic': 'assets/images/drawable/currency/civic.svg',
    'dynamicTradingRights': 'assets/images/drawable/currency/dynamicTradingRights.svg',
    // 'enjinCoin': 'assets/images/drawable/currency/enjinCoin.svg',
    'singularityNET': 'assets/images/drawable/currency/singularityNET.svg',
    'thetaToken': 'assets/images/drawable/currency/thetaToken.svg',
    'monaco': 'assets/images/drawable/currency/monaco.svg',
    'santimentNetworkToken': 'assets/images/drawable/currency/santimentNetworkToken.svg',
    'iExecRLC': 'assets/images/drawable/currency/iExecRLC.svg',
    'raidenNetworkToken': 'assets/images/drawable/currency/raidenNetworkToken.svg',
    'timeNewBank': 'assets/images/drawable/currency/timeNewBank.svg',
    'genaroNetwork': 'assets/images/drawable/currency/genaroNetwork.svg',
    // 'credits': 'assets/images/drawable/currency/credits.svg',
    'wax': 'assets/images/drawable/currency/wax.svg',
    'poet': 'assets/images/drawable/currency/poet.svg',
    'biboxToken': 'assets/images/drawable/currency/biboxToken.svg',
    // 'arcblock': 'assets/images/drawable/currency/arcblock.svg',
    'xpa': 'assets/images/drawable/currency/xpa.svg',
    'highPerformanceBlockchain': 'assets/images/drawable/currency/highPerformanceBlockchain.svg',
    'dew': 'assets/images/drawable/currency/dew.svg',
    'payPie': 'assets/images/drawable/currency/payPie.svg',
    'oyster': 'assets/images/drawable/currency/oyster.svg',
    'edgeless': 'assets/images/drawable/currency/edgeless.svg',
    'envion': 'assets/images/drawable/currency/envion.svg',
    // 'fusion': 'assets/images/drawable/currency/fusion.svg',
    // 'cube': 'assets/images/drawable/currency/cube.svg',
    'sophiaTX': 'assets/images/drawable/currency/sophiaTX.svg',
    'adEx': 'assets/images/drawable/currency/adEx.svg',
    'mediShares': 'assets/images/drawable/currency/mediShares.svg',
    'ethLend': 'assets/images/drawable/currency/ethLend.svg',
    'ost': 'assets/images/drawable/currency/ost.svg',
    'bluzelle': 'assets/images/drawable/currency/bluzelle.svg',
    // 'crypto20': 'assets/images/drawable/currency/crypto20.svg',
    // 'iotChain': 'assets/images/drawable/currency/iotChain.svg',
    // 'leadcoin': 'assets/images/drawable/currency/leadcoin.svg',
    'eidoo': 'assets/images/drawable/currency/eidoo.svg',
    // 'blockv': 'assets/images/drawable/currency/blockv.svg',
    // 'cyberMiles': 'assets/images/drawable/currency/cyberMiles.svg',
    'ripioCreditNetwork': 'assets/images/drawable/currency/ripioCreditNetwork.svg',
    'telcoin': 'assets/images/drawable/currency/telcoin.svg',
    'vibe': 'assets/images/drawable/currency/vibe.svg',
    'sonm': 'assets/images/drawable/currency/sonm.svg',
    'loomNetwork': 'assets/images/drawable/currency/loomNetwork.svg',
    'taas': 'assets/images/drawable/currency/taas.svg',
    'wings': 'assets/images/drawable/currency/wings.svg',
    'сonsensus': 'assets/images/drawable/currency/consensus.svg',
  };

  constructor() { }

  ngOnInit() {
    this.logo = this.logos[this.coin.logo] || '';
  }

  onClick(coin) {
    this.onClicked.emit(coin);
  }
}
