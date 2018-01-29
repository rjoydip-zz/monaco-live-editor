import { Component } from '@angular/core';
import { Router } from '@angular/router';

import PeerId from 'peer-id';
import PouchDB from 'pouchdb-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private db: any;
  private shareId: String;

  constructor(
    private router: Router
  ) {
    this.db = new PouchDB('live_editor_db');
  }

  create() {
    
    PeerId.create({ bits: 1024 }, (err, info) => {
      if (err) throw err;

      let peerInfo = info.toJSON();
      this.shareId = peerInfo.id;

      this.db.put({
        _id: this.shareId,
        content: ''
      }).then((response) => {
        this.router.navigate(['live', this.shareId]);
        console.log("DB initilize");
      }).catch((err) => {
        console.log(err);
      });
    });

  }

}
