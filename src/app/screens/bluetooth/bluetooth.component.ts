import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';


@Component({
  selector: 'app-bluetooth-screen',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../../app.component.css']
})
export class BluetoothScreenComponent {
  status = 'disable';
  myColor = 'warn';
  valueBluetooth = '0';
  bluetoothIcon = 'bluetooth_disabled';
  spinnerClass = 'invisible bluetooth-spinner'

  constructor(public dialog: MatDialog) {
  }

  changeBluetoothStatus() {
    console.log(this.myColor);
    switch (this.valueBluetooth) {
      case '0': { //disable
        this.status = 'enable';
        this.myColor = "primary";
        this.valueBluetooth = "1";
        this.bluetoothIcon = 'bluetooth';
        this.spinnerClass = 'invisible bluetooth-spinner';
        break;
      }
      case '1': { //enable
        this.openDialog();
        this.status = 'enable';
        this.myColor = "accent";
        this.valueBluetooth = "2";
        this.bluetoothIcon = 'bluetooth_searching';
        this.spinnerClass = 'bluetooth-spinner';
        break;
      }
      case '2': { //search
        this.status = 'enable';
        this.myColor = "accent";
        this.valueBluetooth = "3";
        this.bluetoothIcon = 'bluetooth_connected';
        this.spinnerClass = 'invisible bluetooth-spinner';
        break;
      }
      case '3': { //connect
        this.status = 'disable';
        this.myColor = "warn";
        this.valueBluetooth = "0";
        this.bluetoothIcon = 'bluetooth_disabled';
        this.spinnerClass = 'invisible bluetooth-spinner';
        break;
      }
    }
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(ConnectedDevicesDialogComponent, {
      width: '300px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'app-connected-devices-dialog',
  templateUrl: './connected.devices.dialog.html',
})
export class ConnectedDevicesDialogComponent {
  devices = [
    {
      name: 'Photos',
      address: 'nkjhsd,asjd;laskdlakslkdfgsdgdsgdrg',
    },
    {
      name: 'Recipes',
      address: 'nkjhsd,asjd;laskdlakslk',
    },
    {
      name: 'Work',
      address: 'nkjhsd,asjd',
    }
  ];

  constructor(public dialogRef: MatDialogRef<ConnectedDevicesDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  toDo(event): void {
    console.log(JSON.stringify(event));

    this.dialogRef.close();
  }

}
