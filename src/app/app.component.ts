import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private router: Router
  ) {
    if(window.location.pathname.split('/').length < 3) this.router.navigate(['live']);
    else this.router.navigate(['live', window.location.pathname.split('/')[2]]);
  }
}
