import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError } from 'rxjs/operators';

import 'rxjs/add/operator/mapTo';

declare const CryptoCore: any;

export class DDSAccount {
  public address: string = this.account.address;

  constructor(private dds: any,
              private account: any) { }

  public async getBalance() {
    return this.dds.getBalance(this.account);
  }

  public async store(id: string, data: any, gasPrice: number) {
    const accountSecret = await CryptoCore.Utils.getAccountSecret(id);
    return await this.dds.store({
      secret: accountSecret,
      data: data,
      account: this.account,
      gasPrice: gasPrice
    });
  }

  public async estimateGas(id: string, data: any) {
    const accountSecret = await CryptoCore.Utils.getAccountSecret(id);
    return this.dds.estimateStoreGas({
      secret: accountSecret,
      data: data,
      account: this.account
    });
  }
}

@Injectable()
export class DDSService {
  private dds: any = null;
  private network = 'testnet'; // 'main'; | 'testnet';
  private sponsor = 'http://185.219.80.169:8080/sponsor';

  constructor(private readonly http: HttpClient) {
    this.dds = CryptoCore.DDS.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      network: this.network
    });
  }

  public async exists(id: string) {
    const accountSecret = await CryptoCore.Utils.getAccountSecret(id);
    return await this.dds.exists(accountSecret);
  }

  public async read(id: string) {
    const accountSecret = await CryptoCore.Utils.getAccountSecret(id);
    const count = await this.dds.count(accountSecret);
    const data = [];
    for (let i = 0; i < count; ++i) {
      data.push(await this.dds.read(accountSecret, i));
    }

    return data;
  }

  public sponsorStore(id: string, data: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Key': 'fhppcTnjSTkISRoJqq7jKOjUoR8nlfZs',
        'Access-Control-Allow-Origin': '*',
      })
    };

    const body = new HttpParams()
      .set('data', '0x' + data.toString('hex'));

    const url = this.sponsor + '/storage/' + id;

    return this.http.post(
      url,
      body,
      httpOptions
    ).pipe(
      catchError(error => {
        console.log(error);
        return new ErrorObservable('Something bad happened; please try again later.');
      })
    ).mapTo(true);
  }

  public fromWei(wei: any, coin: string) {
    return this.dds.fromWei(wei, coin);
  }

  public toWei(value: any, coin: string) {
    return this.dds.toWei(value, coin);
  }

  public async getStoreAccount(id) {
    const accountSecret = await CryptoCore.Utils.getAccountSecret(id, 1);
    return new DDSAccount(this.dds, this.dds.getAddress(accountSecret));
  }

  public async accountFromSecret(secret: any) {
    return new DDSAccount(this.dds, this.dds.accountFromSecret(secret));
  }
}
