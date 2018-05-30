import { Http, Headers, RequestOptionsArgs } from '@angular/http';
import { HttpWrapper } from "ionic-native-http-angular-wrapper";
import { Injectable } from '@angular/core';
import { catchError, mapTo } from 'rxjs/operators';
import { of } from 'rxjs';
import { WorkerService } from './worker.service';

import { DDS } from 'crypto-core-async';
import { getAccountSecret } from 'crypto-core-async/lib/utils';

export class DDSAccount {
  public address: string = this.account.address;

  constructor(
    private dds: any,
    private account: any,
    private worker: any
  ) { }

  public async getBalance() {
    return this.dds.getBalance(this.account);
  }

  public async store(id: string, data: any, gasPrice: number) {
    const accountSecret = await getAccountSecret(id, 0, this.worker);
    return await this.dds.store({
      secret: accountSecret,
      data: data,
      account: this.account,
      gasPrice: gasPrice
    });
  }

  public async estimateGas(id: string, data: any) {
    const accountSecret = await getAccountSecret(id, 0, this.worker);
    return this.dds.estimateStoreGas({
      id: id,
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

  constructor(
    private readonly http: HttpWrapper,
    private readonly workerService: WorkerService
  ) {
    this.dds = DDS.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      network: this.network
    });
  }

  public async exists(id: string) {
    const accountSecret = await getAccountSecret(id, 0, this.workerService.worker);
    return await this.dds.exists(accountSecret);
  }

  public async read(id: string) {
    const accountSecret = await getAccountSecret(id, 0, this.workerService.worker);
    const count = await this.dds.count(accountSecret);
    const data = [];
    for (let i = 0; i < count; ++i) {
      data.push(await this.dds.read(accountSecret, i));
    }

    return data;
  }

  public sponsorStore(id: string, data: any) {
    const url = this.sponsor + '/storage/' + id;
    const body = {'data': '0x' + data.toString('hex')}

    let httpOptions: RequestOptionsArgs = {
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Key': 'fhppcTnjSTkISRoJqq7jKOjUoR8nlfZs',
        'Access-Control-Allow-Origin': '*',
      })
    }
    return this.http.post(
      url,
      body,
      httpOptions
    ).pipe(
      catchError(error => {
        console.log(error);
        return of('Something bad happened; please try again later.');
      }),
      mapTo(true)
    );
  }

  public fromWei(wei: any, coin: string) {
    return this.dds.fromWei(wei, coin);
  }

  public toWei(value: any, coin: string) {
    return this.dds.toWei(value, coin);
  }

  public async getStoreAccount(id) {
    const accountSecret = await getAccountSecret(id, 1, this.workerService.worker);
    return new DDSAccount(this.dds, this.dds.getAddress(accountSecret), this.workerService.worker);
  }

  public async accountFromSecret(secret: any) {
    return new DDSAccount(this.dds, this.dds.accountFromSecret(secret), this.workerService.worker);
  }
}
