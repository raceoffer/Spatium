import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'bluetooth-screen',
    templateUrl: './bluetooth.component.html',
    styleUrls: ['./bluetooth.component.css', '../../app.component.css']
})
export class BluetoothScreen {
    status = 'disable';
    myColor = 'warn';
    valueBluetooth = '0';
    bluetoothIcon = 'bluetooth_disabled';
    spinnerClass = 'invisible bluetooth-spinner'

    constructor(public dialog: MatDialog) {}

    changeBluetoothStatus(element) {
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
        let dialogRef = this.dialog.open(ConnectedDevicesDialog, {
            width: '250px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }
}

@Component({
    selector: 'connected-devices-dialog',
    templateUrl: 'connected-devices-dialog.html',
})
export class ConnectedDevicesDialog {
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

    constructor(
        public dialogRef: MatDialogRef<ConnectedDevicesDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    toDo(event): void {
        console.log(JSON.stringify(event));
    }

}