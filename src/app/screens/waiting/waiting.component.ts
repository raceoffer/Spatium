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
    this.bt.onConnected = () => {
      this.router.navigate(['/send']);
    };
    this.bt.onDisconnected = () => {
      this.router.navigate(['/waiting']);
    };
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

}
