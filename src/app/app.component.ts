import {
  Component,
  ViewChild,
  ElementRef,
  NgZone,
  TemplateRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import PeerId from 'peer-id';
import swarm from 'webrtc-swarm';
import signalhub from 'signalhub';

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  private sw: any;
  private peer: any;
  private editor: any;
  private value: string;
  private uuid: String;
  private editorDiv: HTMLDivElement;

  @ViewChild('editor') editorContent: ElementRef;

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    PeerId.create({ bits: 1024 }, (err, info) => {
      if (err) {
        this.uuid = 'xxxxxxxxxx4xxxyxxxxxxx9yyyyyxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 24 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(24);
        })
      }

      let peerInfo = info.toJSON();
      this.uuid = peerInfo.id;
      this.value = `"use strict";\nfunction Person(age) {\n\tif (age) {\n\t\tthis.age = age;\n\t}\n}\n\nPerson.prototype.getAge = function () {\n\treturn this.age;\n};\n\nconsole.log("Monaco Live Editor")`;

      // store peerInfo into localstorage
      localStorage.setItem("monaco:editor:peerInfo", JSON.stringify(peerInfo));

      // this.router.navigate(['/live', this.uuid]);

      const urlId = window.location.pathname.split('/')[2];
      this.uuid = (urlId !== undefined) ? urlId : this.uuid;

      console.log(this.uuid);

      // p2p swarm
      this.sw = swarm(signalhub(`${this.uuid}-app`, [
        'https://signalhub-hzbibrznqa.now.sh'
      ]), {});

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
    })
  }

  ngOnDestroy() {}

  // moble device detection
  detectmob() {
    if (navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i)
    ) {
      return true;
    }
    else {
      return false;
    }
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
      wordWrap: 'on', // 'off' | 'on' | 'wordWrapColumn' | 'bounded';
      lineNumbers: 'on', //  'on' | 'off' | 'relative' | ((lineNumber: number) => string);
      lineDecorationsWidth: 30, // number | string;
      fontSize: 16, // number 
      fontWeight: '500',
      formatOnType: true,
      formatOnPaste: true,
      dragAndDrop: true,
      autoIndent: true,
      mouseWheelZoom: true,
      roundedSelection: true,
      insertSpaces: true,
      glyphMargin: false
    });

    this.editor.focus();

    if (this.detectmob()) {
      this.editor.updateOptions({
        fontSize: 12,
        lineNumbers: 'off',
        fontWeight: '400',
        dragAndDrop: false,
        mouseWheelZoom: false
      });
    }

    // action for execution
    this.editor.addAction({
      // An unique identifier of the contributed action.
      id: 'code-execute',

      // A label of the action that will be presented to the user.
      label: 'Execute this code',

      // An optional array of keybindings for the action.
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.F9,
        // chord
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M)
      ],

      // A precondition for this action.
      precondition: null,

      // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
      keybindingContext: null,

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 1.5,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: ed => {
        console.clear();
        console.warn(`\u2728 \u2728 MONACO LIVE EDITOR CONSOLE \u2728 \u2728`)
        var F = new Function(ed.getValue());
        return F();
      }
    });

    // console.log(this.editor.getModel())

    // Auto resize layout 
    window.addEventListener("resize", this.editor.layout());

    // Added statusbar overlay widget
    var overlayWidget = {
      domNode: null,
      getId: () => {
        return 'my.overlay.widget';
      },
      getDomNode: () => {
        const editorLayoutInfo = this.editor.getLayoutInfo();
        const editorCursorPosition = this.editor.getPosition();
        let domNode = document.createElement('div');
        domNode.innerHTML = `<a id="status-line" title="Current Line">Ln ${editorCursorPosition['lineNumber']}, Col ${editorCursorPosition['column']}</a>`;

        domNode.style.background = 'grey';
        domNode.style.color = 'rgb(255, 255, 255)';
        domNode.style.backgroundColor = 'rgb(0, 122, 204)';
        domNode.style.top = `${editorLayoutInfo['height'] - 21}px`;
        domNode.style.width = '100%';
        domNode.style.boxSizing = 'border-box';
        domNode.style.height = '22px';
        domNode.style.fontSize = '12px';
        domNode.style.padding = '1px 10px';
        domNode.style.overflow = 'hidden';
        domNode.style.textAlign = 'right';
        domNode.style.cursor = 'pointer';

        return domNode;
      },
      getPosition: () => {
        return null;
      }
    };
    this.editor.addOverlayWidget(overlayWidget);

    this.zone.run(() => {

      // Update line numbers of cursor's current position in the status bar
      this.editor.onMouseDown(() => {
        let statusLineContent = this.editorDiv.querySelector('#status-line');
        const editorCursorPosition = this.editor.getPosition();
        statusLineContent.innerHTML = `Ln ${editorCursorPosition['lineNumber']}, Col ${editorCursorPosition['column']}`;
      });

      this.sw.on('connect', (peer, id) => {
        console.log('connected to a new peer:', id)

        // TODO: when new peer comes he/she will get original content

        this.editor.onKeyDown(e => {
          this.value = this.editor.getValue();
          if (this.sw.peers.length > 0) peer.send(this.value);
        });

        this.editor.onDidFocusEditor(() => {
          this.value = this.editor.getValue();
          if (this.sw.peers.length > 0) peer.send(this.value);
        })

        peer.on('data', (data) => {
          // got data channel message
          this.editor.setValue(data.toString());
        });

      })

      this.sw.on('disconnect', (peer, id) => {
        console.log('disconnected from a peer:', id)
      })
    });

  }

}
