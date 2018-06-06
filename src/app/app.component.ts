import { Component, OnInit } from '@angular/core';
import { LoggerService } from "./services/logger.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';

  constructor(private readonly logger: LoggerService) { }

  ngOnInit() {}
}
