import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import IPFS from 'ipfs';
import Room from 'ipfs-pubsub-room';

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private room: any;
  private editor: any;
  private value: string;
  private editorDiv: HTMLDivElement;

  @ViewChild('editor') editorContent: ElementRef;

  constructor(
    private zone: NgZone
  ) {
    this.value = 'console.log("Hello world");';
  }

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
    let timestamp = Date.now()
    console.log(timestamp)
    return `ipfs/pubsub-demo/${timestamp}`
  }

  ipfsInit() {
    const ipfs = new IPFS({
      repo: this.repo(),
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm: [
            "/dns4/wrtc-star.discovery.libp2p.io/tcp/433/wss/p2p-webrtc-star"
          ],
          API: "",
          Gateway: ""
        },
        Discovery: {
          MDNS: {
            Enabled: false,
            Interval: 10
          },
          webRTCStar: {
            Enabled: true
          }
        },
        Bootstrap: []
      }
    });

    ipfs.once('ready', () => ipfs.id((err, info) => {
      if (err) { throw err }

      console.log('IPFS node ready with address ' + info.id)
      console.log('Online status: ', ipfs.isOnline() ? 'online' : 'offline')

      this.room = Room(ipfs, 'ipfs-pubsub-demo')

      this.room.on('peer joined', (peer) => {
        console.log('Peer joined the room', peer)
      })

      this.room.on('peer left', (peer) => {
        console.log('Peer left...', peer)
      })

      this.room.on('message', (message) => console.log('got message from ' + message.from + ': ' + message.data.toString()))

      // now started to listen to room
      this.room.on('subscribed', () => {
        console.log('Now connected!', this.room.getPeers())
      })

      this.zone.run(() => {
        this.editor.getModel().onDidChangeContent((e: any) => {
          this.value = this.editor.getValue();
          this.room.broadcast(this.value);
        });
      });
    }))

    ipfs.on('error', (err) => console.warn(err)) // Node has hit some error while initing/starting

    ipfs.on('init', () => console.log("Init IPFS"))     // Node has successfully finished initing the repo
    ipfs.on('start', () => console.log("Start IPFS"))    // Node has started
    ipfs.on('stop', () => console.log("Stop IPFS"))

  }

  // Will be called once monaco library is available
  initMonaco() {
    this.editorDiv = this.editorContent.nativeElement;
    this.editor = monaco.editor.create(this.editorDiv, {
      value: this.value,
      language: 'javascript',
      theme: 'vs-dark', // 'vs' | 'vs-dark' | 'hc-black'
      minimap: {
        enabled: false // boolean
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
