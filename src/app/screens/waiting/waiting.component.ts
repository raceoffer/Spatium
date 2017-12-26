import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, AfterViewInit {
  Label = 'Подключение устройства';
  connect = 'Подключиться';
  disabledBT = true;

  devices = [];

  constructor(private bt: BluetoothService, private router: Router) {}

  ngOnInit() {
    const routerObj = this.router;

    this.bt.onConnected.subscribe(() => {
      routerObj.navigate(['/backup']);
      //routerObj.navigate(['/navigator', {outlets: {'navigator': ['wallet']}, queryParams: { isSecond: true }}]);
    });
    this.bt.onDisconnected.subscribe( () => {
      routerObj.navigate(['/waiting']);
    });
  }

  async ngAfterViewInit() {
    await this.changeBtState();
  }

  async changeBtState() {
    this.disabledBT = !await this.bt.ensureEnabled();
    this.devices = await this.bt.getDevices();
    await this.bt.ensureListening();
  }

  toDo(name, address): void {
    this.router.navigate(['/connect'], { queryParams: { name: name, address: address } });
  }

  sddNewDevice(): void{

  }

  goWallet(): void{
    this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
  }

}
