import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import IPFS from 'ipfs';

import Y from 'yjs';
import YMemory from 'y-memory';
import YArray from 'y-array';
import YText from 'y-text';

Y.extend(YArray, YMemory, YText);
require('y-ipfs-connector')(Y)

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private ipfs: any;
  private editor: any;
  private editorDiv: HTMLDivElement;

  @ViewChild('editor') editorContent: ElementRef;

  constructor(
    private zone: NgZone
  ) { }

  ngAfterViewInit() {
    let onGotAmdLoader = () => {
      // Load monaco
      (<any>window).require.config({ paths: { 'vs': '/assets/monaco/vs' } });
      (<any>window).require(['vs/editor/editor.main'], () => {
        this.initMonaco();
      });
    };

    // Load AMD loader if necessary
    if (!(<any>window).require) {
      const loaderScript = document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = '/assets/monaco/vs/loader.js';
      loaderScript.addEventListener('load', onGotAmdLoader);
      document.body.appendChild(loaderScript);
    } else {
      onGotAmdLoader();
    }
  }

  repo() {
    return 'ipfs/yjs-demo/' + Math.random();
  }

  ipfsInit() {
    this.ipfs = new IPFS({
      repo: this.repo(),
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm: [
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          ]
        }
      }
    });

    this.ipfs.once('ready', () => this.ipfs.id((err, info) => {
      if (err) { throw err }

      console.log('IPFS node ready with address ' + info.id)

      Y({
        db: {
          name: 'memory'
        },
        connector: {
          name: 'ipfs',
          room: 'ipfs-yjs-demo',
          ipfs: this.ipfs
        },
        share: {
          editor: 'Text'
        }
      }).then((y) => {
        this.zone.run(() => {
          this.editor.getModel().onDidChangeContent((e: any) => {
            console.log(2, this.editor.getValue());
          });
        });
        // y.share.editor = this.editorDiv;
      })
    }))
  }

  // Will be called once monaco library is available
  initMonaco() {
    this.editorDiv = this.editorContent.nativeElement;
    this.editor = monaco.editor.create(this.editorDiv, {
      value: [
        'console.log("Hello world!");'
      ].join('\n'),
      language: 'javascript',
      theme: 'vs-dark', // 'vs' | 'vs-dark' | 'hc-black'
      minimap: {
        enabled: false, // boolean
        maxColumn: 120, // number
        showSlider: "always", // "always" | "mouseover"
      },
      automaticLayout: true, // boolean
      wordWrap: 'bounded', // 'off' | 'on' | 'wordWrapColumn' | 'bounded';
      lineNumbers: 'on', //  'on' | 'off' | 'relative' | ((lineNumber: number) => string);
      lineDecorationsWidth: 30, // number | string;
      fontSize: 16, // number 
      fontWeight: '500' // 'normal' | 'bold' | 'bolder' | 'lighter' | 'initial' | 'inherit' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    });

    this.ipfsInit();
  }

}
