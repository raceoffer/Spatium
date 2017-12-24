import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {


  stConnect = 'Подключение';
  busyClass = 'fade-background invisible';
  name: string;
  address: string;



  constructor(private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params); // {order: "popular"}

        this.name = params.name;
        console.log(this.name); // popular
        this.address = params.address;
        console.log(this.address); // popular
      });
  }



}
