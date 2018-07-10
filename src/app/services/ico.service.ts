import { Injectable } from '@angular/core';
import Base58 from 'base-58';
import web3 from 'web3';

@Injectable()
export class ICOService {

  web3 : any;
  contractAddress = '0xec373b3f9637eff1a774e1fff916b54794fbd5a9';

  constructor() {
      this.web3 = new web3( new web3.providers.HttpProvider('http://185.219.80.169:8080/api/etherium/testnet/infura') );
  }

  public async getCampaignList() {
    let result = await this.getIcoContract().methods.getCampaignsList().call();
    let campaings = [];
    let utils = this.web3.utils;
    if(!result[0])
        return campaings;
    
    for(let i = 0; i < result[0].length; i++) {
        let hash = Base58.encode(Buffer.concat([Buffer.from([18,32]), Buffer.from(result[2][i].slice(2), 'hex')]))
        campaings.push(new IcoCampaign(result[0][i], utils.hexToUtf8(result[1][i]), hash));
    }

    return campaings;
  }

  public async getCampaign(address: string) {
      let result = await this.getIcoContract().methods.getCampaign(address).call();
      let data = JSON.parse(this.web3.utils.hexToUtf8(result));
      let campaign = new IcoCampaign('','','');
      campaign.fromJSON(data);
      console.log(data);
      return campaign;
  }

  public async addCampaign(сampaign : IcoCampaign) {
      let hash = Buffer.from(Base58.decode(сampaign.ipfsFolder).slice(2)).toString('hex');

      let addCampaignMethod = this.getIcoContract().methods.addCampaign(сampaign.address,
            сampaign.startDate.getTime() / 1000,
            сampaign.endDate.getTime() / 1000,
            сampaign.startDate.getTime() / 1000,
            сampaign.endDate.getTime() / 1000,
            this.web3.utils.fromUtf8(сampaign.title),
            '0x'+ hash,
            this.web3.utils.fromUtf8(JSON.stringify(сampaign.toJSON()))
        );

      let addCampaignAbi = addCampaignMethod.encodeABI();
      let addCampaignGas = await addCampaignMethod.estimateGas();
      const account = this.web3.eth.accounts.privateKeyToAccount(this.getSecret());
      const tx = {
        from: account.address,
        to: this.contractAddress,
        data: addCampaignAbi,
        gas: Math.round(1.2 * addCampaignGas),
        gasPrice: this.web3.utils.toWei('21', 'gwei')
      };

      const signed = await account.signTransaction(tx);
      let result = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);
    
      console.log(result);
      return result;
  }

  public async removeCampaign(address: string) {
    let removeCampaignMethod = this.getIcoContract().methods.removeCampaign(address);
    let removeCampaignAbi = removeCampaignMethod.encodeABI();
    let removeCampaignGas = await removeCampaignMethod.estimateGas();
    const account = this.web3.eth.accounts.privateKeyToAccount(this.getSecret());
    const tx = {
        from: account.address,
        to: this.contractAddress,
        data: removeCampaignAbi,
        gas: Math.round(1.2 * removeCampaignGas),
        gasPrice: this.web3.utils.toWei('21', 'gwei')
      };
    
    const signed = await account.signTransaction(tx);
    let result = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);
    console.log(result);
    return result;
  }

  private getIcoContract() {
      const contractAbi = [{"constant":false,"inputs":[{"name":"_campaign","type":"address[]"},{"name":"_coin","type":"bytes32[]"},{"name":"_account","type":"address[]"},{"name":"_sum","type":"uint256[]"}],"name":"registerToWhiteList","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getMembersWhiteList","outputs":[{"name":"","type":"address[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"address[]"},{"name":"","type":"uint256[]"},{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_campaigns","type":"address[]"},{"name":"members","type":"address[]"},{"name":"accountsFrom","type":"address[]"},{"name":"accountsTo","type":"address[]"}],"name":"signMemberWhiteList","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getCampaignsListAll","outputs":[{"name":"","type":"address[]"},{"name":"","type":"uint256[]"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCampaignsList","outputs":[{"name":"","type":"address[]"},{"name":"","type":"bytes32[]"},{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"}],"name":"getCampaign","outputs":[{"name":"_parameters","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"checkedAddress","type":"address"}],"name":"isIn","outputs":[{"name":"isIndeed","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_campaign","type":"address"}],"name":"getWhiteList","outputs":[{"name":"","type":"bytes32[]"},{"name":"","type":"address[]"},{"name":"","type":"uint256[]"},{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"_saleStart","type":"uint256"},{"name":"_saleEnd","type":"uint256"},{"name":"_whiteListStart","type":"uint256"},{"name":"_whiteListEnd","type":"uint256"},{"name":"_name","type":"bytes32"},{"name":"_dataLink","type":"bytes32"},{"name":"_parameters","type":"bytes"}],"name":"addCampaign","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"removeCampaign","outputs":[{"name":"status","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"index","type":"uint256"},{"indexed":false,"name":"parameters","type":"bytes"}],"name":"LogNewCampaign","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"index","type":"uint256"},{"indexed":false,"name":"parameters","type":"bytes"}],"name":"LogUpdateCampaign","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"index","type":"uint256"}],"name":"LogDeleteCampaign","type":"event"}];
      const contract = new this.web3.eth.Contract(contractAbi, this.contractAddress);
      return contract;
  }

  private getSecret() {
    return new Buffer([30, 201, 28, 120, 34, 108, 70, 165, 100, 219, 59, 63, 13, 16, 65, 27, 143, 113, 86, 195, 36, 95, 59, 22, 68, 18, 77, 36, 80, 24, 59, 36]);
  }
}

export class IcoCampaign {
    public address: string;
    public title: string;
    public ipfsFolder: string;

    public ticker: string;
    public amountEmitted: number;
    public amountOffered: number;
    public startDate: Date;
    public endDate: Date;
    public type: string;
    public cashbackType: string;

    constructor(address: string, title: string, ipfsFolder: string) {
        this.address = address;
        this.title = title;
        this.ipfsFolder = ipfsFolder;
    }

    public toJSON() : any {
        return {
            ticker: this.ticker,
            startDate: this.startDate ? this.startDate.getTime() : null,
            endDate: this.endDate ? this.endDate.getTime() : null,
            type: this.type,
            cashbackType: this.cashbackType,
            amountEmitted: this.amountEmitted,
            amountOffered: this.amountOffered,
        };
    }

    public fromJSON(data) {
        this.ticker = data.ticker;
        this.startDate = new Date(data.startDate);
        this.endDate = new Date(data.endDate);
        this.type = data.type ? data.type.name : null;
        this.cashbackType = data.cashbackType;
        this.amountEmitted = data.amountEmitted;
        this.amountOffered = data.amountOffered;
    }
}