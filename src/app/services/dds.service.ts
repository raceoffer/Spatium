import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
      id: accountSecret,
      data: data,
      account: this.account,
      gasPrice: gasPrice
    });
  }

  public async estimateGas(id: string, data: any) {
    const accountSecret = await getAccountSecret(id, 0, this.worker);
    return this.dds.estimateStoreGas({
      id: accountSecret,
      data: data,
      account: this.account
    });
  }
}

@Injectable()
export class DDSService {
  private dds: any = null;
  private network = 'main'; // 'main'; | 'testnet';
  private sponsor = 'https://sponsor.spatium.net';
  private secret = 'fhppcTnjSTkISRoJqq7jKOjUoR8nlfZs';

  constructor(
    private readonly httpAngular: HttpClient,
    private readonly workerService: WorkerService
  ) {
    this.dds = DDS.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      network: this.network
    });
  }

  public async exists(id) {
    const accountSecret = await getAccountSecret(id, 0, this.workerService.worker);
    return await this.dds.exists(accountSecret);
  }

  public async read(id) {
    const accountSecret = await getAccountSecret(id, 0, this.workerService.worker);
    const count = await this.dds.count(accountSecret);
    const data = [];
    for (let i = 0; i < count; ++i) {
      data.push(await this.dds.read(accountSecret, i));
    }

    return data;
  }

  public sponsorStore(id, data: any) {
    const url = this.sponsor + '/storage/' + id.toString('hex');
    const body = {'data': '0x' + data.toString('hex')};
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Key': this.secret,
      'Access-Control-Allow-Origin': '*',
    };

    let httpParams = new HttpParams();
    for (const key in body) {
      if (body.hasOwnProperty(key)) {
        httpParams = httpParams.set(key, body[key]);
      }
    }
    return this.httpAngular.post(url, httpParams, {headers: new HttpHeaders((headers))});
  }

  public sponsorFeedback(data: FormData) {
    const XHR = new XMLHttpRequest();
    XHR.open('POST', this.sponsor + '/feedback');
    XHR.setRequestHeader('X-Auth-Key', this.secret);
    XHR.send(data);

    XHR.addEventListener('load', function(event) {
      console.log(event.target);
    });

    // Define what happens in case of error
    XHR.addEventListener('error', function(event) {
      console.log('Oops! Something went wrong.');
    });

    XHR.onreadystatechange = () => {
      if (XHR.readyState === 4) {
        console.log(XHR.response);
        /*if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject(xhr.response);
        }*/
      }
    };
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
