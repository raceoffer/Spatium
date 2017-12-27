import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit, AfterViewInit {
  stConnect = 'Подключение к ';
  busyClass = 'fade-background invisible';
  name: string;
  address: string;

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params); // {order: "popular"}

        this.name = params.name;
        this.stConnect = this.stConnect + this.name;
        console.log(this.name); // popular
        this.address = params.address;
        console.log(this.address); // popular
      });
    this.wallet.onStatus = (status) => {
      console.log(status);
    };
  }

  async ngAfterViewInit() {
    try {
      await this.bt.connect({
        name: this.name,
        address: this.address
      });
    } catch (e) {
      console.log('connect', e);
      this.router.navigate(['/waiting']);
    }
  }

//   //!--- Start sharing
//   const initiatorProver = initiator.startInitialCommitment();
//   const verifierProver = verifier.startInitialCommitment();
//
//   // Step 1: creating commitments
//   const initiatorCommitment = JSON.stringify(initiatorProver.getInitialCommitment());
//   const verifierCommitment = JSON.stringify(verifierProver.getInitialCommitment());
//
//   // Step 3: exchanging decommitments (a party sends its decommitment only after it has received other party's commitment)
//   const initiatorDecommitment = JSON.stringify(initiatorProver.processInitialCommitment(JSON.parse(verifierCommitment)));
//   const verifierDecommitment = JSON.stringify(verifierProver.processInitialCommitment(JSON.parse(initiatorCommitment)));
//
//   // Step 4: decommiting
//   const verifierVerifier = verifierProver.processInitialDecommitment(JSON.parse(initiatorDecommitment));
//   const initiatorVerifier = initiatorProver.processInitialDecommitment(JSON.parse(verifierDecommitment));
//
//   // Further steps: interactive proofs of knowledge
//   const verifierVerifierCommitment = JSON.stringify(verifierVerifier.getCommitment());
//   const initiatorProverCommitment = JSON.stringify(initiatorProver.processCommitment(JSON.parse(verifierVerifierCommitment)));
//   const verifierVerifierDecommitment = JSON.stringify(verifierVerifier.processCommitment(JSON.parse(initiatorProverCommitment)));
//   const initiatorProverDecommitment = JSON.stringify(initiatorProver.processDecommitment(JSON.parse(verifierVerifierDecommitment)));
//   const verifierVerifiedData = verifierVerifier.processDecommitment(JSON.parse(initiatorProverDecommitment));
//   verifier.finishInitialSync(verifierVerifiedData);
//
//   const initiatorVerifierCommitment = JSON.stringify(initiatorVerifier.getCommitment());
//   const verifierProverCommitment = JSON.stringify(verifierProver.processCommitment(JSON.parse(initiatorVerifierCommitment)));
//   const initiatorVerifierDecommitment = JSON.stringify(initiatorVerifier.processCommitment(JSON.parse(verifierProverCommitment)));
//   const verifierProverDecommitment = JSON.stringify(verifierProver.processDecommitment(JSON.parse(initiatorVerifierDecommitment)));
//   const initiatorVerifiedData = initiatorVerifier.processDecommitment(JSON.parse(verifierProverDecommitment));
//   initiator.finishInitialSync(initiatorVerifiedData);
//
//   //!--- End sharing

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router) { }
}
